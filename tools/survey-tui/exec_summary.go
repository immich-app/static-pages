package main

import (
	"fmt"
	"strings"
)

// Midpoint estimates for range-based questions.

var librarySizeMidpoints = map[string]float64{
	"Less than 100GB": 50,
	"100GB - 250GB":   175,
	"250GB - 500GB":   375,
	"500GB - 1TB":     750,
	"1 - 5TB":         3000,
	"5 - 10TB":        7500,
	"10 - 50TB":       30000,
	"50TB+":           75000,
}

var monthlyDataMidpoints = map[string]float64{
	"Less than 1GB": 0.5,
	"1 - 10GB":      5,
	"10 - 50GB":     30,
	"50 - 100GB":    75,
	"100 - 500GB":   300,
	"Over 500GB":    750,
}

var noBackupAnswers = map[string]bool{
	"I don't currently have a backup":     true,
	"RAID (but no offsite/separate copy)": true,
}

func (m model) renderExecSummary(lines *[]string) {
	add := func(s string) { *lines = append(*lines, s) }
	s := m.stats

	add(""); add(sectionTitleStyle.Render("Executive Summary — FUTO Backups Survey"))
	add("")

	// --- Respondent overview ---
	add(""); add(sectionTitleStyle.Render("Respondents"))
	completionPct := float64(0)
	if s.TotalRespondents > 0 {
		completionPct = float64(s.CompletedRespondents) / float64(s.TotalRespondents) * 100
	}
	add(fmt.Sprintf("  %s total respondents, %s completed (%.0f%%)",
		statValueStyle.Render(fmt.Sprintf("%d", s.TotalRespondents)),
		completedValueStyle.Render(fmt.Sprintf("%d", s.CompletedRespondents)),
		completionPct))

	add(""); add(sectionTitleStyle.Render("Email Signups (q17)"))
	add(fmt.Sprintf("  %s unique emails collected", emailValueStyle.Render(fmt.Sprintf("%d", s.UniqueEmails))))
	totalBetaInterest := s.BetaSignups + s.BothSignups
	totalUpdatesInterest := s.ProductUpdateSignups + s.BothSignups
	add(fmt.Sprintf("  %s want to join the closed beta  (%d beta-only + %d both)",
		emailValueStyle.Render(fmt.Sprintf("%d", totalBetaInterest)),
		s.BetaSignups, s.BothSignups))
	add(fmt.Sprintf("  %s want product updates          (%d updates-only + %d both)",
		emailValueStyle.Render(fmt.Sprintf("%d", totalUpdatesInterest)),
		s.ProductUpdateSignups, s.BothSignups))
	if s.CompletedRespondents > 0 {
		signupRate := float64(s.UniqueEmails) / float64(s.CompletedRespondents) * 100
		add(fmt.Sprintf("  Signup rate: %s of completed respondents left an email",
			statValueStyle.Render(fmt.Sprintf("%.1f%%", signupRate))))
	}

	// --- Library size ---
	add(""); add(sectionTitleStyle.Render("Library Size (q4)"))
	if vs, ok := s.Distributions["q4"]; ok && len(vs) > 0 {
		total := 0
		weightedSum := float64(0)
		totalStorageTB := float64(0)
		for _, v := range vs {
			total += v.Count
			if mid, ok := librarySizeMidpoints[v.Value]; ok {
				weightedSum += mid * float64(v.Count)
				totalStorageTB += (mid / 1000) * float64(v.Count)
			}
		}
		if total > 0 {
			mean := weightedSum / float64(total)
			if mean >= 1000 {
				add(fmt.Sprintf("  Estimated mean library: %s",
					statValueStyle.Render(fmt.Sprintf("%.1f TB", mean/1000))))
			} else {
				add(fmt.Sprintf("  Estimated mean library: %s",
					statValueStyle.Render(fmt.Sprintf("%.0f GB", mean))))
			}
			add(fmt.Sprintf("  Estimated total storage across all respondents: %s",
				statValueStyle.Render(fmt.Sprintf("%.0f TB", totalStorageTB))))

			// Median bucket
			cumulative := 0
			for _, v := range vs {
				cumulative += v.Count
				if cumulative >= total/2 {
					add(fmt.Sprintf("  Median bucket: %s", statValueStyle.Render(v.Value)))
					break
				}
			}
		}

		// Size distribution inline
		add("")
		for _, v := range vs {
			pct := float64(v.Count) / float64(total) * 100
			add(fmt.Sprintf("  %s %s %s",
				distCountStyle.Render(fmt.Sprintf("%5d", v.Count)),
				pctStyle.Render(fmt.Sprintf("%5.1f%%", pct)),
				distLabelStyle.Render(v.Value)))
		}
	}

	// --- Backup status (RAID = no backup) ---
	add(""); add(sectionTitleStyle.Render("Backup Status (q7) — RAID counted as no backup"))
	if vs, ok := s.Distributions["q7"]; ok && len(vs) > 0 {
		total := 0
		noBackup := 0
		for _, v := range vs {
			total += v.Count
			if noBackupAnswers[v.Value] {
				noBackup += v.Count
			}
		}
		if total > 0 {
			noBackupPct := float64(noBackup) / float64(total) * 100
			hasBackupPct := 100 - noBackupPct
			add(fmt.Sprintf("  %s of respondents have %s",
				funnelDropStyle.Render(fmt.Sprintf("%.0f%%", noBackupPct)),
				funnelDropStyle.Render(fmt.Sprintf("NO real backup (%d)", noBackup))))
			add(fmt.Sprintf("  %s of respondents have %s",
				statValueStyle.Render(fmt.Sprintf("%.0f%%", hasBackupPct)),
				statValueStyle.Render(fmt.Sprintf("a real backup (%d)", total-noBackup))))
		}
		add("")
		for _, v := range vs {
			pct := float64(v.Count) / float64(total) * 100
			label := v.Value
			marker := "  "
			if noBackupAnswers[v.Value] {
				marker = funnelDropStyle.Render("⚠ ")
			}
			add(fmt.Sprintf("  %s%s %s %s",
				marker,
				distCountStyle.Render(fmt.Sprintf("%5d", v.Count)),
				pctStyle.Render(fmt.Sprintf("%5.1f%%", pct)),
				distLabelStyle.Render(label)))
		}
	}

	// --- Monthly new data ---
	add(""); add(sectionTitleStyle.Render("Monthly New Data (q9)"))
	if vs, ok := s.Distributions["q9"]; ok && len(vs) > 0 {
		total := 0
		weightedSum := float64(0)
		for _, v := range vs {
			total += v.Count
			if mid, ok := monthlyDataMidpoints[v.Value]; ok {
				weightedSum += mid * float64(v.Count)
			}
		}
		if total > 0 {
			mean := weightedSum / float64(total)
			add(fmt.Sprintf("  Estimated mean monthly ingestion: %s",
				statValueStyle.Render(fmt.Sprintf("%.1f GB", mean))))
		}
		add("")
		for _, v := range vs {
			pct := float64(v.Count) / float64(total) * 100
			add(fmt.Sprintf("  %s %s %s",
				distCountStyle.Render(fmt.Sprintf("%5d", v.Count)),
				pctStyle.Render(fmt.Sprintf("%5.1f%%", pct)),
				distLabelStyle.Render(v.Value)))
		}
	}

	// --- Interest level ---
	add(""); add(sectionTitleStyle.Render("Interest Level (q10)"))
	if vs, ok := s.Distributions["q10"]; ok && len(vs) > 0 {
		total := 0
		interested := 0
		for _, v := range vs {
			total += v.Count
			if v.Value == "Very interested" || v.Value == "Interested" {
				interested += v.Count
			}
		}
		if total > 0 {
			pct := float64(interested) / float64(total) * 100
			add(fmt.Sprintf("  %s interested or very interested",
				statValueStyle.Render(fmt.Sprintf("%.0f%% (%d/%d)", pct, interested, total))))
		}
		add("")
		for _, v := range vs {
			pct := float64(v.Count) / float64(total) * 100
			add(fmt.Sprintf("  %s %s %s",
				distCountStyle.Render(fmt.Sprintf("%5d", v.Count)),
				pctStyle.Render(fmt.Sprintf("%5.1f%%", pct)),
				distLabelStyle.Render(v.Value)))
		}
	}

	// --- Willingness to pay ---
	add(""); add(sectionTitleStyle.Render("Willingness to Pay (q11)"))
	if vs, ok := s.Distributions["q11"]; ok && len(vs) > 0 {
		total := 0
		wouldPay := 0
		for _, v := range vs {
			total += v.Count
			if !strings.Contains(v.Value, "wouldn't pay") {
				wouldPay += v.Count
			}
		}
		if total > 0 {
			payPct := float64(wouldPay) / float64(total) * 100
			add(fmt.Sprintf("  %s willing to pay something",
				statValueStyle.Render(fmt.Sprintf("%.0f%% (%d/%d)", payPct, wouldPay, total))))
		}
		add("")
		for _, v := range vs {
			pct := float64(v.Count) / float64(total) * 100
			add(fmt.Sprintf("  %s %s %s",
				distCountStyle.Render(fmt.Sprintf("%5d", v.Count)),
				pctStyle.Render(fmt.Sprintf("%5.1f%%", pct)),
				distLabelStyle.Render(v.Value)))
		}
	}

	// --- TAM estimate ---
	add(""); add(sectionTitleStyle.Render("Addressable Market Estimate"))
	q10vs, haveQ10 := s.Distributions["q10"]
	q11vs, haveQ11 := s.Distributions["q11"]
	q4vs, haveQ4 := s.Distributions["q4"]
	if haveQ10 && haveQ11 && haveQ4 {
		q10total := 0
		interested := 0
		for _, v := range q10vs {
			q10total += v.Count
			if v.Value == "Very interested" || v.Value == "Interested" {
				interested += v.Count
			}
		}
		q11total := 0
		wouldPay := 0
		for _, v := range q11vs {
			q11total += v.Count
			if !strings.Contains(v.Value, "wouldn't pay") {
				wouldPay += v.Count
			}
		}
		q4total := 0
		weightedStorage := float64(0)
		for _, v := range q4vs {
			q4total += v.Count
			if mid, ok := librarySizeMidpoints[v.Value]; ok {
				weightedStorage += mid * float64(v.Count)
			}
		}

		if q10total > 0 && q11total > 0 && q4total > 0 {
			interestedRate := float64(interested) / float64(q10total)
			wouldPayRate := float64(wouldPay) / float64(q11total)
			conversionEst := interestedRate * wouldPayRate
			meanLibGB := weightedStorage / float64(q4total)
			meanLibTB := meanLibGB / 1000

			potentialCustomers := conversionEst * float64(s.CompletedRespondents)
			potentialTB := potentialCustomers * meanLibTB

			add(fmt.Sprintf("  Interest rate × willingness to pay: %s",
				statValueStyle.Render(fmt.Sprintf("%.0f%% × %.0f%% = %.0f%% potential conversion",
					interestedRate*100, wouldPayRate*100, conversionEst*100))))
			add(fmt.Sprintf("  Among %d completed respondents: ~%s potential customers",
				s.CompletedRespondents,
				statValueStyle.Render(fmt.Sprintf("%.0f", potentialCustomers))))
			add(fmt.Sprintf("  At mean library %.1f TB: ~%s potential TB to store",
				meanLibTB,
				statValueStyle.Render(fmt.Sprintf("%.0f TB", potentialTB))))
			add(fmt.Sprintf("  At $4/TB/mo: ~%s/mo potential revenue (survey respondents only)",
				completedValueStyle.Render(fmt.Sprintf("$%.0f", potentialTB*4))))
			add("")
			add(dimStyle.Render("  ⚠ Survey respondents are a self-selected sample; real conversion will differ"))
		}
	}

	// --- Key qualitative findings ---
	add(""); add(sectionTitleStyle.Render("Key Findings from Free-Text Comments (q19)"))
	add(fmt.Sprintf("  %s respondents left a comment", statValueStyle.Render(fmt.Sprintf("%d", s.UniqueCommenters))))
	add("")
	add(distLabelStyle.Render("  Top demand:     Self-hostable backup / BYOS (S3, SFTP, friend's NAS)"))
	add(distLabelStyle.Render("  #2 demand:      E2E encryption with user-held keys (BYOK)"))
	add(distLabelStyle.Render("  #3 demand:      EU / non-US datacenter (hard dealbreaker for many)"))
	add(distLabelStyle.Render("  Organic idea:   Buddy backup (mutual backup between friends' instances)"))
	add("")
	add(distLabelStyle.Render("  Pricing ref:    Backblaze B2 (~$6/TB) is the universal benchmark"))
	add(distLabelStyle.Render("  Concern:        RAID-only users don't realize they have no backup"))
	add(distLabelStyle.Render("  Concern:        Conflict-of-interest / enshittification fear"))
	add(distLabelStyle.Render("  Concern:        Immich-only scope too narrow (users back up whole homelab)"))
	add(distLabelStyle.Render("  Sentiment:      Overwhelmingly positive about Immich, cautious about managed cloud"))
}
