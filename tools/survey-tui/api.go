package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

// D1 API types

type d1Request struct {
	SQL string `json:"sql"`
}

type d1Response struct {
	Result []d1Result `json:"result"`
	Errors []d1Error  `json:"errors"`
}

type d1Result struct {
	Results json.RawMessage `json:"results"`
}

type d1Error struct {
	Message string `json:"message"`
}

func queryD1(accountID, apiToken, dbID, sql string) (json.RawMessage, error) {
	body, err := json.Marshal(d1Request{SQL: sql})
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("https://api.cloudflare.com/client/v4/accounts/%s/d1/database/%s/query", accountID, dbID)
	req, err := http.NewRequest("POST", url, strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+apiToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("D1 API returned %d: %s", resp.StatusCode, string(respBody))
	}

	var d1Resp d1Response
	if err := json.Unmarshal(respBody, &d1Resp); err != nil {
		return nil, fmt.Errorf("unmarshal: %w", err)
	}

	if len(d1Resp.Errors) > 0 {
		return nil, fmt.Errorf("D1 error: %s", d1Resp.Errors[0].Message)
	}

	if len(d1Resp.Result) == 0 {
		return nil, fmt.Errorf("no results")
	}

	return d1Resp.Result[0].Results, nil
}

func extractCount(raw json.RawMessage) int {
	var rows []map[string]any
	if err := json.Unmarshal(raw, &rows); err != nil || len(rows) == 0 {
		return 0
	}
	if v, ok := rows[0]["cnt"]; ok {
		if n, ok := v.(float64); ok {
			return int(n)
		}
	}
	return 0
}

func requireEnv() (accountID, apiToken, databaseID string) {
	accountID = os.Getenv("CLOUDFLARE_ACCOUNT_ID")
	apiToken = os.Getenv("CLOUDFLARE_API_TOKEN")
	databaseID = os.Getenv("D1_DATABASE_ID")

	if accountID == "" || apiToken == "" || databaseID == "" {
		fmt.Fprintln(os.Stderr, "Required env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, D1_DATABASE_ID")
		os.Exit(1)
	}
	return
}
