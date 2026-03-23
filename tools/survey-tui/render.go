package main

import (
	"fmt"
	"strings"
)

func (m model) renderOverview(lines *[]string) {
	add := func(s string) { *lines = append(*lines, s) }
	s := m.stats

	add(""); add(sectionTitleStyle.Render("Respondents"))
	add(statLabelStyle.Render("Total respondents") + statValueStyle.Render(fmt.Sprintf("%d", s.TotalRespondents)))
	add(statLabelStyle.Render("Completed surveys") + completedValueStyle.Render(fmt.Sprintf("%d", s.CompletedRespondents)))
	add(statLabelStyle.Render("In progress") + statValueStyle.Render(fmt.Sprintf("%d", s.InProgress)))
	if s.TotalRespondents > 0 {
		pct := float64(s.CompletedRespondents) / float64(s.TotalRespondents) * 100
		add(statLabelStyle.Render("Completion rate") + completedValueStyle.Render(fmt.Sprintf("%.1f%%", pct)))
	}

	add(""); add(sectionTitleStyle.Render("Engagement"))
	add(statLabelStyle.Render("Total answers recorded") + statValueStyle.Render(fmt.Sprintf("%d", s.TotalAnswers)))
	if s.AvgAnswers > 0 {
		add(statLabelStyle.Render("Avg answers/respondent") + statValueStyle.Render(fmt.Sprintf("%.1f / 18", s.AvgAnswers)))
	}
	add(statLabelStyle.Render("Unique email signups") + emailValueStyle.Render(fmt.Sprintf("%d", s.UniqueEmails)))
	add(statLabelStyle.Render("  Beta only") + emailValueStyle.Render(fmt.Sprintf("%d", s.BetaSignups)))
	add(statLabelStyle.Render("  Updates only") + emailValueStyle.Render(fmt.Sprintf("%d", s.ProductUpdateSignups)))
	add(statLabelStyle.Render("  Both") + emailValueStyle.Render(fmt.Sprintf("%d", s.BothSignups)))
	add(statLabelStyle.Render("Left a comment (q19)") + statValueStyle.Render(fmt.Sprintf("%d", s.UniqueCommenters)))

	add(""); add(sectionTitleStyle.Render("Recent Activity"))
	add(statLabelStyle.Render("New respondents (1h)") + statValueStyle.Render(fmt.Sprintf("%d", s.RecentRespondents1h)))
	add(statLabelStyle.Render("New respondents (24h)") + statValueStyle.Render(fmt.Sprintf("%d", s.RecentRespondents24h)))

	// Quick highlights from key distributions
	add(""); add(sectionTitleStyle.Render("Quick Highlights"))

	if vs, ok := s.Distributions["q10"]; ok && len(vs) > 0 {
		interested := 0
		total := 0
		for _, v := range vs {
			total += v.Count
			if v.Value == "Very interested" || v.Value == "Interested" {
				interested += v.Count
			}
		}
		if total > 0 {
			pct := float64(interested) / float64(total) * 100
			add(statLabelStyle.Render("Interest (q10)") + statValueStyle.Render(fmt.Sprintf("%.0f%% interested or very interested", pct)))
		}
	}

	if vs, ok := s.Distributions["q7"]; ok && len(vs) > 0 {
		for _, v := range vs {
			if strings.Contains(v.Value, "don't currently") {
				total := 0
				for _, vv := range vs {
					total += vv.Count
				}
				if total > 0 {
					pct := float64(v.Count) / float64(total) * 100
					add(statLabelStyle.Render("No backup (q7)") + funnelDropStyle.Render(fmt.Sprintf("%.0f%% have no backup", pct)))
				}
				break
			}
		}
	}

	if vs, ok := s.Distributions["q11"]; ok && len(vs) > 0 {
		wouldntPay := 0
		total := 0
		for _, v := range vs {
			total += v.Count
			if strings.Contains(v.Value, "wouldn't pay") {
				wouldntPay += v.Count
			}
		}
		if total > 0 {
			pct := float64(total-wouldntPay) / float64(total) * 100
			add(statLabelStyle.Render("Would pay (q11)") + statValueStyle.Render(fmt.Sprintf("%.0f%% willing to pay something", pct)))
		}
	}
}

func (m model) renderFunnel(lines *[]string) {
	add := func(s string) { *lines = append(*lines, s) }
	s := m.stats

	add(""); add(sectionTitleStyle.Render("Response Funnel"))
	add(dimStyle.Render("Shows drop-off from q1 → completion"))
	add("")

	if len(s.PerQuestion) == 0 {
		add(dimStyle.Render("No data yet"))
		return
	}

	// Get max for bar scaling.
	maxCount := 0
	for _, qid := range allQuestionIDs {
		if c, ok := s.PerQuestion[qid]; ok && c > maxCount {
			maxCount = c
		}
	}

	barMax := 40
	if m.width > 0 && m.width-46 < barMax {
		barMax = m.width - 46
	}
	if barMax < 5 {
		barMax = 5
	}

	prevCount := 0
	for i, qid := range allQuestionIDs {
		count := s.PerQuestion[qid]
		label := questionLabelMap[qid]

		barLen := 0
		if maxCount > 0 {
			barLen = count * barMax / maxCount
		}
		if barLen == 0 && count > 0 {
			barLen = 1
		}

		bar := barStyle.Render(strings.Repeat("█", barLen))

		dropStr := ""
		if i > 0 && prevCount > 0 {
			drop := prevCount - count
			if drop > 0 {
				dropPct := float64(drop) / float64(prevCount) * 100
				dropStr = funnelDropStyle.Render(fmt.Sprintf(" ↓%d (%.0f%%)", drop, dropPct))
			}
		}

		id := funnelIDStyle.Render(qid)
		lbl := funnelLabelStyle.Render(label)
		add(fmt.Sprintf("%s%s %s %d%s", id, lbl, bar, count, dropStr))

		prevCount = count
	}

	add("")
	add(""); add(sectionTitleStyle.Render("Completion"))
	if maxCount > 0 {
		completedBarLen := s.CompletedRespondents * barMax / maxCount
		if completedBarLen == 0 && s.CompletedRespondents > 0 {
			completedBarLen = 1
		}
		completedBar := completedValueStyle.Render(strings.Repeat("█", completedBarLen))
		lbl := funnelLabelStyle.Render("Marked complete")
		add(fmt.Sprintf("     %s %s %d", lbl, completedBar, s.CompletedRespondents))

		if s.PerQuestion["q1"] > 0 {
			overallPct := float64(s.CompletedRespondents) / float64(s.PerQuestion["q1"]) * 100
			add(dimStyle.Render(fmt.Sprintf("     %.0f%% of those who started q1 completed the survey", overallPct)))
		}
	}
}

func (m model) renderSection(lines *[]string, sec sectionMeta) {
	add := func(s string) { *lines = append(*lines, s) }
	st := m.stats

	add(""); add(sectionTitleStyle.Render(fmt.Sprintf("Section %d: %s", sec.Number, sec.Title)))
	add("")

	for _, q := range sec.Questions {
		count := st.PerQuestion[q.ID]
		header := fmt.Sprintf("%s — %s (%d responses)", q.ID, q.Label, count)
		add(""); add(questionTitleStyle.Render(header))

		switch q.Type {
		case "radio":
			m.renderDistribution(lines, q.ID, count)
		case "email":
			add(fmt.Sprintf("  %s unique email addresses collected",
				emailValueStyle.Render(fmt.Sprintf("%d", st.UniqueEmails))))
			totalBeta := st.BetaSignups + st.BothSignups
			totalUpdates := st.ProductUpdateSignups + st.BothSignups
			add(fmt.Sprintf("  %s want the closed beta, %s want product updates, %s want both",
				emailValueStyle.Render(fmt.Sprintf("%d", totalBeta)),
				emailValueStyle.Render(fmt.Sprintf("%d", totalUpdates)),
				emailValueStyle.Render(fmt.Sprintf("%d", st.BothSignups))))
			if st.CompletedRespondents > 0 {
				pct := float64(st.UniqueEmails) / float64(st.CompletedRespondents) * 100
				add(fmt.Sprintf("  %s",
					dimStyle.Render(fmt.Sprintf("%.1f%% of completed respondents signed up", pct))))
			}
		case "textarea":
			add(fmt.Sprintf("  %s respondents left a comment",
				statValueStyle.Render(fmt.Sprintf("%d", st.UniqueCommenters))))
			if st.CompletedRespondents > 0 {
				pct := float64(st.UniqueCommenters) / float64(st.CompletedRespondents) * 100
				add(fmt.Sprintf("  %s",
					dimStyle.Render(fmt.Sprintf("%.1f%% of completed respondents commented", pct))))
			}
		}
		add("")
	}
}

func (m model) renderDistribution(lines *[]string, qid string, total int) {
	add := func(s string) { *lines = append(*lines, s) }

	vs, ok := m.stats.Distributions[qid]
	if !ok || len(vs) == 0 {
		add(dimStyle.Render("  No responses yet"))
		return
	}

	maxVal := vs[0].Count

	barMax := 30
	if m.width > 0 && m.width-56 < barMax {
		barMax = m.width - 56
	}
	if barMax < 5 {
		barMax = 5
	}

	maxLabelWidth := 44
	if m.width > 0 && m.width-36 < maxLabelWidth {
		maxLabelWidth = m.width - 36
	}
	if maxLabelWidth < 20 {
		maxLabelWidth = 20
	}

	for _, v := range vs {
		barLen := 0
		if maxVal > 0 {
			barLen = v.Count * barMax / maxVal
		}
		if barLen == 0 && v.Count > 0 {
			barLen = 1
		}

		pct := float64(0)
		if total > 0 {
			pct = float64(v.Count) / float64(total) * 100
		}

		truncated := v.Value
		if len(truncated) > maxLabelWidth {
			truncated = truncated[:maxLabelWidth-1] + "…"
		}

		bar := distBarStyle.Render(strings.Repeat("█", barLen))
		count := distCountStyle.Render(fmt.Sprintf("%5d", v.Count))
		pctStr := pctStyle.Render(fmt.Sprintf("%5.1f%%", pct))
		add(fmt.Sprintf("  %s %s %s %s", count, pctStr, bar, distLabelStyle.Render(truncated)))
	}
}
