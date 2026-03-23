package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// Stats

type surveyStats struct {
	TotalRespondents     int
	CompletedRespondents int
	InProgress           int
	TotalAnswers         int
	UniqueEmails         int
	BetaSignups          int
	ProductUpdateSignups int
	BothSignups          int
	UniqueCommenters     int
	AvgAnswers           float64
	RecentRespondents1h  int
	RecentRespondents24h int
	PerQuestion          map[string]int         // question_id -> count
	Distributions        map[string][]valueStat // question_id -> value distribution
	FetchedAt            time.Time
	Err                  error
}

type valueStat struct {
	Value string
	Count int
}

// Model

type model struct {
	stats      surveyStats
	accountID  string
	apiToken   string
	databaseID string
	page       int
	scroll     int
	width      int
	height     int
	quitting   bool

	// Comments tab state.
	commentsState  commentsState
	comments       []comment
	commentsErr    error
	commentsSearch string
	searchMode     bool
}

type statsMsg surveyStats

func (m model) fetchStats() tea.Msg {
	stats := surveyStats{
		FetchedAt:     time.Now(),
		PerQuestion:   make(map[string]int),
		Distributions: make(map[string][]valueStat),
	}

	type qj struct {
		name string
		sql  string
	}

	queries := []qj{
		{"respondents", `
			SELECT
				COUNT(*) as total,
				SUM(CASE WHEN is_complete = 1 THEN 1 ELSE 0 END) as completed
			FROM respondents`},
		{"recent_1h", `
			SELECT COUNT(*) as cnt FROM respondents
			WHERE created_at > datetime('now', '-1 hour')`},
		{"recent_24h", `
			SELECT COUNT(*) as cnt FROM respondents
			WHERE created_at > datetime('now', '-1 day')`},
		{"total_answers", `SELECT COUNT(*) as cnt FROM answers`},
		{"unique_emails", `
			SELECT COUNT(DISTINCT answer) as cnt FROM answers
			WHERE question_id = 'q17' AND answer != ''`},
		{"email_signups", `
			SELECT other_text, COUNT(*) as cnt FROM answers
			WHERE question_id = 'q17' AND answer != '' AND other_text IS NOT NULL
			GROUP BY other_text`},
		{"unique_commenters", `
			SELECT COUNT(DISTINCT respondent_id) as cnt FROM answers
			WHERE question_id = 'q19' AND answer != ''`},
		{"avg_answers", `
			SELECT AVG(cnt) as avg_cnt FROM (
				SELECT COUNT(*) as cnt FROM answers GROUP BY respondent_id
			)`},
		{"per_question", `
			SELECT question_id, COUNT(*) as cnt
			FROM answers GROUP BY question_id`},
	}

	// Distributions for every radio question.
	for _, s := range sections {
		for _, q := range s.Questions {
			if q.Type != "radio" {
				continue
			}
			queries = append(queries, qj{
				name: "dist_" + q.ID,
				sql: fmt.Sprintf(`
					SELECT answer, COUNT(*) as cnt
					FROM answers WHERE question_id = '%s'
					GROUP BY answer ORDER BY cnt DESC`, q.ID),
			})
		}
	}

	for _, q := range queries {
		rows, err := queryD1(m.accountID, m.apiToken, m.databaseID, q.sql)
		if err != nil {
			stats.Err = fmt.Errorf("%s: %w", q.name, err)
			return statsMsg(stats)
		}

		switch q.name {
		case "respondents":
			var r []struct {
				Total     float64 `json:"total"`
				Completed float64 `json:"completed"`
			}
			json.Unmarshal(rows, &r)
			if len(r) > 0 {
				stats.TotalRespondents = int(r[0].Total)
				stats.CompletedRespondents = int(r[0].Completed)
				stats.InProgress = stats.TotalRespondents - stats.CompletedRespondents
			}
		case "recent_1h":
			stats.RecentRespondents1h = extractCount(rows)
		case "recent_24h":
			stats.RecentRespondents24h = extractCount(rows)
		case "total_answers":
			stats.TotalAnswers = extractCount(rows)
		case "unique_emails":
			stats.UniqueEmails = extractCount(rows)
		case "email_signups":
			var r []struct {
				OtherText string  `json:"other_text"`
				Count     float64 `json:"cnt"`
			}
			json.Unmarshal(rows, &r)
			for _, row := range r {
				c := int(row.Count)
				switch row.OtherText {
				case "Join the closed beta":
					stats.BetaSignups += c
				case "Receive product updates":
					stats.ProductUpdateSignups += c
				case "Join the closed beta,Receive product updates",
					"Receive product updates,Join the closed beta":
					stats.BothSignups += c
				}
			}
		case "unique_commenters":
			stats.UniqueCommenters = extractCount(rows)
		case "avg_answers":
			var r []struct {
				AvgCnt *float64 `json:"avg_cnt"`
			}
			json.Unmarshal(rows, &r)
			if len(r) > 0 && r[0].AvgCnt != nil {
				stats.AvgAnswers = *r[0].AvgCnt
			}
		case "per_question":
			var r []struct {
				QuestionID string  `json:"question_id"`
				Count      float64 `json:"cnt"`
			}
			json.Unmarshal(rows, &r)
			for _, row := range r {
				stats.PerQuestion[row.QuestionID] = int(row.Count)
			}
		default:
			if qid, ok := strings.CutPrefix(q.name, "dist_"); ok {
				var r []struct {
					Answer string  `json:"answer"`
					Count  float64 `json:"cnt"`
				}
				json.Unmarshal(rows, &r)
				var vs []valueStat
				for _, row := range r {
					vs = append(vs, valueStat{Value: row.Answer, Count: int(row.Count)})
				}
				stats.Distributions[qid] = vs
			}
		}
	}

	return statsMsg(stats)
}

func (m model) Init() tea.Cmd {
	return m.fetchStats
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		// Search mode intercepts all keys except ctrl+c.
		if m.searchMode {
			switch msg.String() {
			case "ctrl+c":
				m.quitting = true
				return m, tea.Quit
			case "esc":
				m.searchMode = false
				m.commentsSearch = ""
				m.scroll = 0
			case "enter":
				m.searchMode = false
				m.scroll = 0
			case "backspace":
				if len(m.commentsSearch) > 0 {
					m.commentsSearch = m.commentsSearch[:len(m.commentsSearch)-1]
					m.scroll = 0
				}
			default:
				if len(msg.String()) == 1 {
					m.commentsSearch += msg.String()
					m.scroll = 0
				}
			}
			return m, nil
		}

		switch msg.String() {
		case "q", "ctrl+c", "esc":
			m.quitting = true
			return m, tea.Quit
		case "r":
			return m, m.fetchStats
		case "tab", "l", "right":
			m.page = (m.page + 1) % totalPages()
			m.scroll = 0
		case "shift+tab", "h", "left":
			m.page = (m.page - 1 + totalPages()) % totalPages()
			m.scroll = 0
		case "up", "k":
			if m.scroll > 0 {
				m.scroll--
			}
		case "down", "j":
			m.scroll++
		case "1":
			m.page = 0
			m.scroll = 0
		case "2":
			m.page = 1
			m.scroll = 0
		case "3":
			m.page = 2
			m.scroll = 0
		case "4":
			m.page = 3
			m.scroll = 0
		case "5":
			m.page = 4
			m.scroll = 0
		case "6":
			m.page = 5
			m.scroll = 0
		case "7":
			if totalPages() > 6 {
				m.page = 6
				m.scroll = 0
			}
		case "8":
			if totalPages() > 7 {
				m.page = 7
				m.scroll = 0
			}
		case "9":
			if totalPages() > 8 {
				m.page = 8
				m.scroll = 0
			}
		case "f":
			if m.page == pageCommentsAI() && m.commentsState != commentsFetching {
				m.commentsState = commentsFetching
				m.commentsErr = nil
				m.comments = nil
				return m, m.fetchComments
			}
		case "/":
			if m.page == pageCommentsAI() && m.commentsState == commentsLoaded {
				m.searchMode = true
				return m, nil
			}
		}
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	case statsMsg:
		m.stats = surveyStats(msg)
	case commentsFetchedMsg:
		if msg.Err != nil {
			m.commentsState = commentsLoaded
			m.commentsErr = msg.Err
			return m, nil
		}
		m.commentsState = commentsLoaded
		m.comments = msg.Comments
	}
	return m, nil
}

// padRight pads s with spaces to width, accounting for ANSI escape codes.
func padRight(s string, width int) string {
	visible := lipgloss.Width(s)
	if visible >= width {
		return s
	}
	return s + strings.Repeat(" ", width-visible)
}

func (m model) View() string {
	if m.quitting {
		return ""
	}

	viewHeight := m.height
	if viewHeight <= 0 {
		viewHeight = 50
	}

	// --- Build sidebar lines ---
	var sidebarLines []string
	sidebarLines = append(sidebarLines, titleStyle.Render("FUTO Survey"))
	sidebarLines = append(sidebarLines, "")

	for i := 0; i < totalPages(); i++ {
		label := fmt.Sprintf(" %d %s", i+1, pageName(i))
		if len(label) > sidebarWidth-1 {
			label = label[:sidebarWidth-2] + "…"
		}
		if i == m.page {
			sidebarLines = append(sidebarLines, sidebarActiveStyle.Render(padRight(label, sidebarWidth-1)))
		} else {
			sidebarLines = append(sidebarLines, sidebarItemStyle.Render(label))
		}
	}

	// Pad sidebar to fill height.
	for len(sidebarLines) < viewHeight {
		sidebarLines = append(sidebarLines, "")
	}

	// --- Build content lines ---
	var contentLines []string

	if m.stats.Err != nil {
		contentLines = append(contentLines, errorStyle.Render(fmt.Sprintf("Error: %v", m.stats.Err)))
		contentLines = append(contentLines, "")
	}

	switch m.page {
	case pageOverview:
		m.renderOverview(&contentLines)
	case pageFunnel:
		m.renderFunnel(&contentLines)
	default:
		if m.page == pageExecSummary() {
			m.renderExecSummary(&contentLines)
		} else if m.page == pageCommentsAI() {
			m.renderCommentsTab(&contentLines)
		} else {
			sectionIdx := m.page - 2
			if sectionIdx >= 0 && sectionIdx < len(sections) {
				m.renderSection(&contentLines, sections[sectionIdx])
			}
		}
	}

	// Apply scroll to content.
	maxScroll := len(contentLines) - viewHeight
	if maxScroll < 0 {
		maxScroll = 0
	}
	if m.scroll > maxScroll {
		m.scroll = maxScroll
	}
	if m.scroll < 0 {
		m.scroll = 0
	}

	end := m.scroll + viewHeight
	if end > len(contentLines) {
		end = len(contentLines)
	}
	visible := contentLines[m.scroll:end]

	// Pad content to fill height, with footer on last line.
	for len(visible) < viewHeight-1 {
		visible = append(visible, "")
	}
	footer := ""
	if !m.stats.FetchedAt.IsZero() {
		footer = dimStyle.Render(fmt.Sprintf("Updated %s · r=refresh  ←/→=page  ↑/↓=scroll  1-9=jump  q=quit", m.stats.FetchedAt.Format("15:04:05")))
	} else {
		footer = dimStyle.Render("Loading... · r=refresh  ←/→=page  ↑/↓=scroll  1-9=jump  q=quit")
	}
	visible = append(visible, footer)

	// --- Compose: join sidebar and content line-by-line ---
	border := sidebarBorder.Render("│")
	var output strings.Builder
	for i := 0; i < viewHeight; i++ {
		sl := ""
		if i < len(sidebarLines) {
			sl = sidebarLines[i]
		}
		cl := ""
		if i < len(visible) {
			cl = visible[i]
		}
		output.WriteString(padRight(sl, sidebarWidth))
		output.WriteString(border)
		output.WriteString(" ")
		output.WriteString(cl)
		if i < viewHeight-1 {
			output.WriteString("\n")
		}
	}

	return output.String()
}

func runComments() {
	accountID, apiToken, databaseID := requireEnv()

	// Fetch q19 answers and all "other" free-text from any question.
	commentRows, err := queryD1(accountID, apiToken, databaseID, `
		SELECT respondent_id, answer, answered_at
		FROM answers
		WHERE question_id = 'q19' AND answer != ''
		ORDER BY answered_at DESC`)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching comments: %v\n", err)
		os.Exit(1)
	}

	otherRows, err := queryD1(accountID, apiToken, databaseID, `
		SELECT respondent_id, question_id, other_text, answered_at
		FROM answers
		WHERE other_text IS NOT NULL AND other_text != ''
		ORDER BY question_id, answered_at DESC`)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error fetching other-text: %v\n", err)
		os.Exit(1)
	}

	var comments []struct {
		RespondentID string `json:"respondent_id"`
		Answer       string `json:"answer"`
		AnsweredAt   string `json:"answered_at"`
	}
	json.Unmarshal(commentRows, &comments)

	var others []struct {
		RespondentID string `json:"respondent_id"`
		QuestionID   string `json:"question_id"`
		OtherText    string `json:"other_text"`
		AnsweredAt   string `json:"answered_at"`
	}
	json.Unmarshal(otherRows, &others)

	fmt.Printf("=== Free-text comments (q19): %d responses ===\n\n", len(comments))
	for i, c := range comments {
		fmt.Printf("--- #%d [%s] respondent:%s ---\n%s\n\n", i+1, c.AnsweredAt, c.RespondentID[:8], c.Answer)
	}

	fmt.Printf("=== \"Other\" free-text responses: %d entries ===\n\n", len(others))
	curQ := ""
	for _, o := range others {
		if o.QuestionID != curQ {
			curQ = o.QuestionID
			label := questionLabelMap[curQ]
			if label == "" {
				label = curQ
			}
			fmt.Printf("--- %s: %s ---\n", curQ, label)
		}
		fmt.Printf("  [%s] %s\n", o.AnsweredAt, o.OtherText)
	}
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "comments" {
		runComments()
		return
	}

	accountID, apiToken, databaseID := requireEnv()

	m := model{
		accountID:  accountID,
		apiToken:   apiToken,
		databaseID: databaseID,
	}

	p := tea.NewProgram(m, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
