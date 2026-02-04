package dev.ultradex.plugin.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import dev.ultradex.plugin.services.UltraDexService
import com.intellij.openapi.ui.Messages

class GenerateAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val service = UltraDexService.getInstance(project)
        
        val input = Messages.showInputDialog(
            project,
            "What do you want to build?",
            "Generate Implementation Plan",
            Messages.getQuestionIcon()
        )
        
        if (!input.isNullOrEmpty()) {
            // In a real plugin, we'd pipe this to the tool window, but for now we just fire and forget or notify
            service.runCommand("generate "$input"") { output ->
                // TODO: pipe to tool window
            }
            Messages.showInfoMessage("Generation started. Check the Ultra-Dex tool window.", "Ultra-Dex")
        }
    }
}
