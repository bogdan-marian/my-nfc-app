import { useState, useRef, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import Button from "./components/Button";
import ImageViewer from "./components/ImageViewer";
import * as ImagePicker from "expo-image-picker";

import CircleButton from "./components/CircleButton";
import IconButton from "./components/IconButton";
import EmojiPicker from "./components/EmojiPicker";
import EmojiList from "./components/EmojiList";
import EmojiSticker from "./components/EmojiSticker";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { Alert } from "react-native";
import NfcManager, { NfcTech, Ndef, NfcEvents } from "react-native-nfc-manager";

const PlaceholderImage = require("./assets/images/background-image.png");

export default function App() {
  const [status, requestPermission] = MediaLibrary.usePermissions();
  const imageRef = useRef();
  const [selectedImage, setSelectedImage] = useState(null);
  const [showAppOptions, setShowAppOptions] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pickedEmoji, setPickedEmoji] = useState(null);
  const [isNfcModalVisible, setIsNfcModalVisible] = useState(false);

  // Initialize NFC Manager in your main component or App component
  useEffect(() => {
    NfcManager.start();
  }, []);

  if (status === null) {
    requestPermission();
  }

  const onReset = () => {
    setShowAppOptions(false);
  };

  const onAddSticker = () => {
    setIsModalVisible(true);
  };

  const onModalClose = () => {
    setIsModalVisible(false);
  };

  const onSaveImageAsync = async () => {
    try {
      const localUri = await captureRef(imageRef, {
        height: 440,
        quality: 1,
      });

      await MediaLibrary.saveToLibraryAsync(localUri);
      if (localUri) {
        alert("Saved!");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setShowAppOptions(true);
    } else {
      alert("You did not select any image.");
    }
  };

  const onScanNFCip = async () => {
    try {
      console.log("Scan NFCip initiated by android");

      // Request NFC tech
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Get the tag
      const tag = await NfcManager.getTag();

      // Log the tag data in JSON format
      console.log("NFC Tag Data: ", JSON.stringify(tag, null, 2));

      // Cleanup
      await NfcManager.cancelTechnologyRequest();
    } catch (e) {
      console.log(e);
    }
  };
  
  const onWriteNFCip = async () => {
    try {
      console.log("Write NFCip initiated by android");
  
      // Request NFC tech
      await NfcManager.requestTechnology([NfcTech.Ndef]);
  
      // Get the tag and check if it is writable
      const tag = await NfcManager.getTag();
      console.log("Tag discovered:", tag);
  
      if (!tag.isWritable) {
        console.warn("Tag is not writable.");
        Alert.alert("Error", "Tag is not writable.");
        return;
      }
  
      // Create the JSON object
      const jsonData = {
        id: "vxMoneyMessage",
        message: "HelloWorld",
      };
  
      // Convert the JSON object to a string
      const jsonString = JSON.stringify(jsonData);
  
      // Encode the JSON string as an NDEF record
      const message = Ndef.encodeMessage([
        Ndef.textRecord(jsonString),
      ]);
  
      if (!message) {
        console.warn("Failed to create NDEF message");
        Alert.alert("Failed to create NDEF message");
        return;
      }
  
      console.log("Writing NDEF message...");
      await writeNdefMessageWithRetry(message, 3); // Retry up to 3 times
      console.log("Successfully wrote NDEF message");
      Alert.alert("Successfully wrote NDEF message");
    } catch (ex) {
      console.warn("Write NFC error:", ex);
      Alert.alert("Failed to write NDEF message", ex.toString());
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
        console.log("NFC technology request canceled");
      } catch (cleanupError) {
        console.warn("Failed to cancel NFC technology request", cleanupError);
      }
    }
  };

  const writeNdefMessageWithRetry = async (message, retries) => {
    for (let i = 0; i < retries; i++) {
      try {
        await NfcManager.writeNdefMessage(message, {
          reconnectAfterWrite: false,
        }); // Add the parameter here
        return;
      } catch (error) {
        console.warn(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          throw new Error(
            `Failed to write NDEF message after ${retries} attempts: ${error.message}`
          );
        }
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.imageContainer}>
        <View ref={imageRef} collapsable={false}>
          <ImageViewer
            placeholderImageSource={PlaceholderImage}
            selectedImage={selectedImage}
          />
          {pickedEmoji && (
            <EmojiSticker imageSize={40} stickerSource={pickedEmoji} />
          )}
        </View>
      </View>
      {showAppOptions ? (
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <IconButton icon="refresh" label="Reset" onPress={onReset} />
            <CircleButton onPress={onAddSticker} />
            {/** <IconButton icon="save-alt" label="Save" onPress={onSaveImageAsync} />*/}
            <IconButton icon="nfc" label="Scan" onPress={onScanNFCip} />
            <IconButton icon="nfc" label="Write" onPress={onWriteNFCip} />
          </View>
        </View>
      ) : (
        <View style={styles.footerContainer}>
          <Button
            theme="primary"
            label="Choose a photo"
            onPress={pickImageAsync}
          />
          <Button
            label="Use this photo"
            onPress={() => setShowAppOptions(true)}
          />
        </View>
      )}

      <EmojiPicker isVisible={isModalVisible} onClose={onModalClose}>
        <EmojiList onSelect={setPickedEmoji} onCloseModal={onModalClose} />
      </EmojiPicker>

      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    paddingTop: 58,
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
  },
  optionsContainer: {
    position: "absolute",
    bottom: 80,
  },
  optionsRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
