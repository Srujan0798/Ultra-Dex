package com.ultradex.plugin

import com.intellij.openapi.components.Service

@Service
class UltraDexPluginService {
    fun status(): String = "Ultra-Dex plugin initialized"
}
