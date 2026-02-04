package dev.ultradex.plugin.services

import com.intellij.execution.configurations.GeneralCommandLine
import com.intellij.execution.process.OSProcessHandler
import com.intellij.execution.process.ProcessAdapter
import com.intellij.execution.process.ProcessEvent
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Key
import java.nio.charset.StandardCharsets

@Service(Service.Level.PROJECT)
class UltraDexService(private val project: Project) {

    companion object {
        fun getInstance(project: Project): UltraDexService {
            return project.getService(UltraDexService::class.java)
        }
    }

    fun runCommand(command: String, onOutput: (String) -> Unit) {
        val basePath = project.basePath ?: return
        
        try {
            // Determine executable (npx or ultra-dex direct)
            // Using npx is safer to ensure we get the project version
            val generalCommandLine = GeneralCommandLine("npx", "ultra-dex", command)
            generalCommandLine.charset = StandardCharsets.UTF_8
            generalCommandLine.setWorkDirectory(basePath)
            
            // Add environment variables if needed
            // generalCommandLine.environment["FORCE_COLOR"] = "1" // Enable color output if parsed correctly

            val processHandler = OSProcessHandler(generalCommandLine)
            processHandler.startNotify()

            processHandler.addProcessListener(object : ProcessAdapter() {
                override fun onTextAvailable(event: ProcessEvent, outputType: Key<*>) {
                    // Simple output capture
                    onOutput(event.text)
                }

                override fun processTerminated(event: ProcessEvent) {
                    onOutput("
Process finished with exit code ${event.exitCode}
")
                }
            })

        } catch (e: Exception) {
            onOutput("Error executing command: ${e.message}
")
        }
    }
}
