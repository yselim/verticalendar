import { FC, useState } from "react"
import { Modal, Pressable, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import Ionicons from "@react-native-vector-icons/ionicons"
import { useAudioPlayer } from "expo-audio"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import {
  getReminderSoundByFilename,
  getReminderSoundFilename,
  getReminderSoundIndex,
  reminderSoundOptions,
  setReminderSoundFilename,
} from "@/utils/reminderSounds"
import { backupDatabase, restoreDatabase, downloadBackup } from "@/utils/backup"

export const SettingsScreen: FC = function SettingsScreen() {
  const [showSoundModal, setShowSoundModal] = useState(false)
  const [selectedFilename, setSelectedFilename] = useState(getReminderSoundFilename())
  const previewPlayer = useAudioPlayer()

  const handleSelectSound = (filename: string) => {
    setReminderSoundFilename(filename)
    setSelectedFilename(filename)
    setShowSoundModal(false)
  }

  const handlePlaySound = async (filename: string) => {
    try {
      const option = getReminderSoundByFilename(filename)
      previewPlayer.replace(option.source)
      previewPlayer.play()
    } catch {
      // Ignore playback errors for now.
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$content}>
        <Text text="Ayarlar" preset="heading" style={$title} />

        <TouchableOpacity style={$rowButton} activeOpacity={0.8} onPress={() => setShowSoundModal(true)}>
          <Text text="Hatırlatıcı Sesi" style={$rowTitle} />
          <Text text={`${getReminderSoundIndex(selectedFilename)}`} style={$rowValue} />
        </TouchableOpacity>

        <View style={{ marginTop: 24, gap: 12 }}>
          <Text text="Veri Yönetimi" size="md" weight="bold" style={{ marginBottom: 4 }} />
          
          <TouchableOpacity style={$rowButton} activeOpacity={0.8} onPress={backupDatabase}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="share-outline" size={20} color="#555" />
              <Text text="Verileri Paylaş" style={$rowTitle} />
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={$rowButton} activeOpacity={0.8} onPress={downloadBackup}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="download-outline" size={20} color="#555" />
              <Text text="Cihaza Kaydet (.db)" style={$rowTitle} />
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={$rowButton} activeOpacity={0.8} onPress={restoreDatabase}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={20} color="#555" />
              <Text text="Yedekleri Yükle" style={$rowTitle} />
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showSoundModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSoundModal(false)}
      >
        <Pressable style={$modalOverlay} onPress={() => setShowSoundModal(false)}>
          <Pressable style={$modalContent} onPress={() => {}}>
            <Text text="Hatırlatıcı Sesi" style={$modalTitle} />

            {reminderSoundOptions.map((item, index) => {
              const selected = item.filename === selectedFilename
              return (
                <View key={item.filename} style={$soundRow}>
                  <TouchableOpacity
                    style={[$selectButton, selected && $selectButtonSelected]}
                    activeOpacity={0.8}
                    onPress={() => handleSelectSound(item.filename)}
                  >
                    <Text text={`${index + 1}`} style={[$selectButtonText, selected && $selectButtonTextSelected]} />
                    {selected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={$playButton}
                    activeOpacity={0.8}
                    onPress={() => handlePlaySound(item.filename)}
                  >
                    <Ionicons name="play" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
}

const $content: ViewStyle = {
  flex: 1,
  paddingHorizontal: 16,
  paddingTop: 16,
}

const $title: TextStyle = {
  fontSize: 24,
  marginBottom: 16,
}

const $rowButton: ViewStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#f8f8f8",
}

const $rowTitle: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#222",
}

const $rowValue: TextStyle = {
  fontSize: 15,
  fontWeight: "700",
  color: "#555",
}

const $modalOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.45)",
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 20,
}

const $modalContent: ViewStyle = {
  width: "100%",
  maxWidth: 360,
  backgroundColor: "#fff",
  borderRadius: 14,
  padding: 16,
  gap: 10,
}

const $modalTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 4,
}

const $soundRow: ViewStyle = {
  flexDirection: "row",
  gap: 10,
}

const $selectButton: ViewStyle = {
  flex: 1,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: "#d8d8d8",
  backgroundColor: "#f4f4f4",
  paddingVertical: 12,
  paddingHorizontal: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $selectButtonSelected: ViewStyle = {
  backgroundColor: "#2f7f5f",
  borderColor: "#2f7f5f",
}

const $selectButtonText: TextStyle = {
  fontSize: 15,
  color: "#222",
  fontWeight: "700",
}

const $selectButtonTextSelected: TextStyle = {
  color: "#fff",
}

const $playButton: ViewStyle = {
  width: 48,
  borderRadius: 10,
  backgroundColor: "#555",
  alignItems: "center",
  justifyContent: "center",
}
