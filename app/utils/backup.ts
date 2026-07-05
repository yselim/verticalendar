import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

const DB_NAME = 'verticalendar.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

/**
 * Copies the current database to a temporary location and opens the Share Sheet.
 */
export const backupDatabase = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
    if (!fileInfo.exists) {
      Alert.alert("Hata", "Yedeklenecek veritabanı bulunamadı.");
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupName = `Verticalendar_backup_${timestamp}.db`;
    const backupPath = FileSystem.cacheDirectory + backupName;

    await FileSystem.copyAsync({
      from: DB_PATH,
      to: backupPath,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(backupPath, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Verileri Yedekle',
        UTI: 'com.sqlite.db',
      });
    }
  } catch (error) {
    console.error("Backup Error:", error);
    Alert.alert("Hata", "Yedekleme sırasında bir sorun oluştu.");
  }
};

/**
 * Allows the user to select a .db file and overwrites the current database.
 */
export const restoreDatabase = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/x-sqlite3', 'application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const selectedFile = result.assets[0];
    
    // Simple extension check
    if (!selectedFile.name.endsWith('.db')) {
      const confirm = await new Promise((resolve) => {
        Alert.alert(
          "Uyarı",
          "Seçilen dosya .db uzantılı değil. Bu işlem verilerin bozulmasına neden olabilir. Devam etmek istiyor musunuz?",
          [
            { text: "İptal", onPress: () => resolve(false), style: "cancel" },
            { text: "Devam Et", onPress: () => resolve(true) }
          ]
        );
      });
      if (!confirm) return;
    }

    // Ensure the destination directory exists
    const sqliteDir = `${FileSystem.documentDirectory}SQLite/`;
    const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }

    // Overwrite the existing DB file
    await FileSystem.copyAsync({
      from: selectedFile.uri,
      to: DB_PATH,
    });

    Alert.alert(
      "Başarılı", 
      "Veriler başarıyla yüklendi. Değişikliklerin görülmesi için lütfen uygulamayı kapatıp tekrar açın."
    );
  } catch (error) {
    console.error("Restore Error:", error);
    Alert.alert("Hata", "Yedek yükleme sırasında bir sorun oluştu.");
  }
};
