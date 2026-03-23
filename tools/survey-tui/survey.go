package main

import "fmt"

// Survey metadata

type questionMeta struct {
	ID    string
	Label string
	Type  string // "radio", "email", "textarea"
}

type sectionMeta struct {
	Number    int
	Title     string
	Questions []questionMeta
}

var sections = []sectionMeta{
	{1, "Server, Library & Internet", []questionMeta{
		{"q1", "Server location", "radio"},
		{"q2", "Download speed", "radio"},
		{"q3", "Upload speed", "radio"},
		{"q4", "Library size", "radio"},
		{"q5", "Video percentage", "radio"},
		{"q6", "Self-hosting experience", "radio"},
	}},
	{2, "Current Backup Solution", []questionMeta{
		{"q7", "Current backup method", "radio"},
		{"q8", "Backup frequency", "radio"},
		{"q9", "Monthly new data", "radio"},
	}},
	{3, "Interest & Pricing", []questionMeta{
		{"q10", "Interest level", "radio"},
		{"q11", "Willingness to pay", "radio"},
		{"q12", "Backup copies wanted", "radio"},
	}},
	{4, "Infrastructure", []questionMeta{
		{"q13", "Storage type", "radio"},
		{"q14", "Drive type", "radio"},
		{"q15", "OS / Hypervisor", "radio"},
		{"q16", "How running Immich", "radio"},
	}},
	{5, "Beta & Feedback", []questionMeta{
		{"q17", "Email signup", "email"},
		{"q19", "Additional comments", "textarea"},
	}},
}

var allQuestionIDs []string
var questionLabelMap = map[string]string{}

func init() {
	for _, s := range sections {
		for _, q := range s.Questions {
			allQuestionIDs = append(allQuestionIDs, q.ID)
			questionLabelMap[q.ID] = q.Label
		}
	}
}

// Pages: overview, funnel, section 1..5, executive summary, AI analysis.
const (
	pageOverview = 0
	pageFunnel   = 1
	// pages 2..6 = section 1..5
)

func pageExecSummary() int { return 2 + len(sections) }
func pageCommentsAI() int  { return 3 + len(sections) }
func totalPages() int      { return 4 + len(sections) }

func pageName(p int) string {
	switch p {
	case pageOverview:
		return "Overview"
	case pageFunnel:
		return "Funnel"
	default:
		if p == pageExecSummary() {
			return "Exec Summary"
		}
		if p == pageCommentsAI() {
			return "Comments"
		}
		idx := p - 2
		if idx >= 0 && idx < len(sections) {
			return fmt.Sprintf("S%d: %s", sections[idx].Number, sections[idx].Title)
		}
		return "?"
	}
}
