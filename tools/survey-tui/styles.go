package main

import "github.com/charmbracelet/lipgloss"

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#FAFAFA")).
			Background(lipgloss.Color("#7D56F4")).
			Padding(0, 1)

	statLabelStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#888888")).
			Width(26)

	statValueStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#04B575"))

	completedValueStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("#FFD700"))

	emailValueStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#FF79C6"))

	barStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#04B575"))

	distBarStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#BD93F9"))

	errorStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FF0000"))

	dimStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#555555"))

	sectionTitleStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#FAFAFA")).
				Bold(true)

	questionTitleStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#FF79C6")).
				Bold(true)

	distLabelStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#CCCCCC"))

	distCountStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#BD93F9")).
			Bold(true)

	pctStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#888888"))

	funnelIDStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#7D56F4")).
			Width(5)

	funnelLabelStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#888888")).
				Width(26)

	funnelDropStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FF5555"))
)

const sidebarWidth = 26

var (
	sidebarBorder = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#444444"))

	sidebarItemStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#888888"))

	sidebarActiveStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("#FAFAFA")).
				Background(lipgloss.Color("#7D56F4"))
)
