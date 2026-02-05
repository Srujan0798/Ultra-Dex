plugins {
    id("java")
    id("org.jetbrains.intellij") version "1.17.4"
    kotlin("jvm") version "1.9.22"
}

group = "com.ultradex"
version = "1.0.0"

repositories {
    mavenCentral()
}

intellij {
    version.set("2023.3")
    type.set("IC")
    plugins.set(listOf())
}

tasks {
    patchPluginXml {
        sinceBuild.set("233")
        untilBuild.set("241.*")
    }
}
