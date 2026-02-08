package dev.ultradex.plugin.ui

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTextArea
import java.awt.BorderLayout
import java.awt.Dimension
import java.awt.GridLayout
import javax.swing.JButton
import javax.swing.JPanel
import javax.swing.BorderFactory
import dev.ultradex.plugin.services.UltraDexService

class UltraDexToolWindowFactory : ToolWindowFactory {

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val ultraDexPanel = UltraDexPanel(project)
        val contentFactory = ContentFactory.SERVICE.getInstance()
        val content = contentFactory.createContent(ultraDexPanel, "", false)
        toolWindow.contentManager.addContent(content)
    }

    private class UltraDexPanel(private val project: Project) : JPanel(BorderLayout()) {
        private val outputArea = JBTextArea()
        private val service = UltraDexService.getInstance(project)

        init {
            border = BorderFactory.createEmptyBorder(10, 10, 10, 10)

            // Header
            // add(JLabel("Ultra-Dex Control Center"), BorderLayout.NORTH)

            // Output Area
            outputArea.isEditable = false
            outputArea.lineWrap = true
            outputArea.wrapStyleWord = true
            val scrollPane = JBScrollPane(outputArea)
            scrollPane.preferredSize = Dimension(300, 400)
            add(scrollPane, BorderLayout.CENTER)

            // Action Buttons
            val buttonPanel = JPanel(GridLayout(0, 1, 5, 5)) // Vertical grid
            
            addButton(buttonPanel, "🚀 Dashboard", "dashboard")
            addButton(buttonPanel, "🔄 Sync Context", "sync")
            addButton(buttonPanel, "📝 Generate Plan", "generate")
            addButton(buttonPanel, "✨ Verify Status", "status")
            addButton(buttonPanel, "🤖 Run Swarm", "swarm")
            addButton(buttonPanel, "🚑 Fix Issues", "fix")

            add(buttonPanel, BorderLayout.SOUTH)
        }

        private fun addButton(panel: JPanel, label: String, command: String) {
            val button = JButton(label)
            button.addActionListener {
                outputArea.text = "Running: ultra-dex $command...
"
                // Execute command
                service.runCommand(command) { output ->
                    outputArea.append(output)
                    // Auto-scroll to bottom
                    outputArea.caretPosition = outputArea.document.length
                }
            }
            panel.add(button)
        }
    }
}
