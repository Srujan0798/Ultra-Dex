package dev.ultradex.plugin.actions

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import dev.ultradex.plugin.services.UltraDexService
import com.intellij.openapi.ui.Messages

class SyncAction : AnAction() {
    override fun actionPerformed(e: AnActionEvent) {
        val project = e.project ?: return
        val service = UltraDexService.getInstance(project)
        
        service.runCommand("sync") { _ -> }
        Messages.showInfoMessage("Sync started. Check the Ultra-Dex tool window.", "Ultra-Dex")
    }
}
