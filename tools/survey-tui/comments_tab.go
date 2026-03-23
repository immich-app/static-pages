package main

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"unicode"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// State for the comments tab.
type commentsState int

const (
	commentsIdle commentsState = iota
	commentsFetching
	commentsLoaded
)

type comment struct {
	RespondentID string
	Answer       string
	AnsweredAt   string
}

// Messages.
type commentsFetchedMsg struct {
	Comments []comment
	Err      error
}

// fetchComments fetches all q19 comments from D1.
func (m model) fetchComments() tea.Msg {
	rows, err := queryD1(m.accountID, m.apiToken, m.databaseID, `
		SELECT respondent_id, answer, answered_at
		FROM answers
		WHERE question_id = 'q19' AND answer != ''
		ORDER BY answered_at DESC`)
	if err != nil {
		return commentsFetchedMsg{Err: fmt.Errorf("fetch: %w", err)}
	}

	var raw []struct {
		RespondentID string `json:"respondent_id"`
		Answer       string `json:"answer"`
		AnsweredAt   string `json:"answered_at"`
	}
	if err := json.Unmarshal(rows, &raw); err != nil {
		return commentsFetchedMsg{Err: fmt.Errorf("parse: %w", err)}
	}

	comments := make([]comment, len(raw))
	for i, r := range raw {
		comments[i] = comment{
			RespondentID: r.RespondentID,
			Answer:       r.Answer,
			AnsweredAt:   r.AnsweredAt,
		}
	}

	return commentsFetchedMsg{Comments: comments}
}

// filteredComments returns comments matching the current search query.
func (m model) filteredComments() []comment {
	if m.commentsSearch == "" {
		return m.comments
	}
	q := strings.ToLower(m.commentsSearch)
	var out []comment
	for _, c := range m.comments {
		if strings.Contains(strings.ToLower(c.Answer), q) {
			out = append(out, c)
		}
	}
	return out
}

// wordFrequency returns top N words (3+ chars, lowercased) across comments.
func wordFrequency(comments []comment, topN int) []wordCount {
	freq := map[string]int{}
	for _, c := range comments {
		seen := map[string]bool{} // count each word once per comment
		for _, word := range strings.FieldsFunc(c.Answer, func(r rune) bool {
			return !unicode.IsLetter(r) && !unicode.IsDigit(r)
		}) {
			w := strings.ToLower(word)
			if len(w) < 3 || stopWords[w] {
				continue
			}
			if !seen[w] {
				seen[w] = true
				freq[w]++
			}
		}
	}

	var wcs []wordCount
	for w, c := range freq {
		wcs = append(wcs, wordCount{Word: w, Count: c})
	}
	sort.Slice(wcs, func(i, j int) bool { return wcs[i].Count > wcs[j].Count })
	if len(wcs) > topN {
		wcs = wcs[:topN]
	}
	return wcs
}

type wordCount struct {
	Word  string
	Count int
}

// avgCommentLength returns average word count across comments.
func avgCommentLength(comments []comment) float64 {
	if len(comments) == 0 {
		return 0
	}
	total := 0
	for _, c := range comments {
		total += len(strings.Fields(c.Answer))
	}
	return float64(total) / float64(len(comments))
}

var commentBorderStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("#444444"))

var commentIDStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("#7D56F4"))

var commentDateStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("#888888"))

var searchStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("#FFD700")).
	Bold(true)

var matchHighlightStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("#FFD700")).
	Bold(true)

func (m model) renderCommentsTab(lines *[]string) {
	add := func(s string) { *lines = append(*lines, s) }

	add(""); add(sectionTitleStyle.Render("Comments (q19)"))
	add("")

	switch m.commentsState {
	case commentsIdle:
		add(dimStyle.Render("  Press 'f' to fetch all comments"))

	case commentsFetching:
		add(dimStyle.Render("  Fetching comments from D1..."))

	case commentsLoaded:
		if m.commentsErr != nil {
			add(errorStyle.Render(fmt.Sprintf("  Error: %v", m.commentsErr)))
			add("")
		}

		filtered := m.filteredComments()

		// Stats bar.
		statsLine := fmt.Sprintf("  %s comments",
			statValueStyle.Render(fmt.Sprintf("%d", len(m.comments))))
		if m.commentsSearch != "" {
			statsLine += fmt.Sprintf("  %s matching %s",
				emailValueStyle.Render(fmt.Sprintf("%d", len(filtered))),
				searchStyle.Render(fmt.Sprintf("\"%s\"", m.commentsSearch)))
		}
		avgLen := avgCommentLength(m.comments)
		statsLine += fmt.Sprintf("  avg %s words",
			dimStyle.Render(fmt.Sprintf("%.0f", avgLen)))
		add(statsLine)
		add("")

		// Top words.
		topWords := wordFrequency(filtered, 12)
		if len(topWords) > 0 {
			var wordParts []string
			for _, wc := range topWords {
				wordParts = append(wordParts,
					fmt.Sprintf("%s%s",
						distCountStyle.Render(fmt.Sprintf("%d", wc.Count)),
						dimStyle.Render("×"+wc.Word)))
			}
			add("  " + strings.Join(wordParts, "  "))
			add("")
		}

		// Search prompt.
		if m.searchMode {
			add(searchStyle.Render(fmt.Sprintf("  / %s▍", m.commentsSearch)))
		} else if m.commentsSearch != "" {
			add(dimStyle.Render(fmt.Sprintf("  filter: \"%s\"  (/ to edit, Esc to clear)", m.commentsSearch)))
		} else {
			add(dimStyle.Render("  / to search · f to refresh"))
		}
		add("")

		// Separator.
		contentWidth := m.width - sidebarWidth - 2
		if contentWidth < 40 {
			contentWidth = 40
		}
		add(commentBorderStyle.Render("  " + strings.Repeat("─", contentWidth-4)))
		add("")

		// Comments list.
		if len(filtered) == 0 {
			add(dimStyle.Render("  No comments match your search."))
		}
		for i, c := range filtered {
			id := c.RespondentID
			if len(id) > 8 {
				id = id[:8]
			}

			// Header line: #N  respondent:xxxxxxxx  2025-03-20T...
			header := fmt.Sprintf("  %s  %s  %s",
				commentIDStyle.Render(fmt.Sprintf("#%d", i+1)),
				dimStyle.Render(id),
				commentDateStyle.Render(c.AnsweredAt))
			add(header)

			// Comment body, wrapped and indented.
			wrapWidth := contentWidth - 4 // 2 indent + 2 margin
			if wrapWidth < 20 {
				wrapWidth = 20
			}
			for _, paragraph := range strings.Split(c.Answer, "\n") {
				for _, wrapped := range wrapLine(paragraph, wrapWidth) {
					if m.commentsSearch != "" {
						wrapped = highlightMatches(wrapped, m.commentsSearch)
					}
					add("  " + wrapped)
				}
			}

			add("")
		}
	}
}

// wrapLine breaks a line into multiple lines at word boundaries.
func wrapLine(s string, width int) []string {
	if width <= 0 || len(s) <= width {
		return []string{s}
	}
	words := strings.Fields(s)
	if len(words) == 0 {
		return []string{""}
	}
	var lines []string
	cur := words[0]
	for _, w := range words[1:] {
		if len(cur)+1+len(w) > width {
			lines = append(lines, cur)
			cur = w
		} else {
			cur += " " + w
		}
	}
	lines = append(lines, cur)
	return lines
}

// highlightMatches wraps matching substrings with ANSI bold+yellow.
func highlightMatches(text, query string) string {
	if query == "" {
		return text
	}
	lower := strings.ToLower(text)
	q := strings.ToLower(query)
	var result strings.Builder
	pos := 0
	for {
		idx := strings.Index(lower[pos:], q)
		if idx < 0 {
			result.WriteString(text[pos:])
			break
		}
		result.WriteString(text[pos : pos+idx])
		matchEnd := pos + idx + len(query)
		result.WriteString(matchHighlightStyle.Render(text[pos+idx : matchEnd]))
		pos = matchEnd
	}
	return result.String()
}

var stopWords = map[string]bool{
	"the": true, "and": true, "for": true, "that": true, "this": true,
	"with": true, "you": true, "are": true, "but": true, "not": true,
	"have": true, "from": true, "would": true, "will": true, "can": true,
	"been": true, "has": true, "was": true, "were": true, "they": true,
	"their": true, "there": true, "what": true, "when": true, "which": true,
	"who": true, "how": true, "all": true, "each": true, "your": true,
	"than": true, "also": true, "into": true, "could": true, "about": true,
	"just": true, "like": true, "very": true, "some": true, "any": true,
	"only": true, "other": true, "more": true, "much": true, "most": true,
	"own": true, "too": true, "don": true, "does": true, "did": true,
	"should": true, "its": true, "it's": true, "i'm": true, "i'd": true,
}
