import React, { useState, useEffect } from 'react';
import { View, Button, Modal, Text, TouchableOpacity, StyleSheet, Alert, PermissionsAndroid, DeviceEventEmitter } from 'react-native';
import RNCallKeep from 'react-native-callkeep';

function OngoingCallScreen({ startTime, onEnd, caller }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!startTime) {return;}
    setSeconds(Math.floor((Date.now() - startTime) / 1000));
    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <View style={styles.ongoingContainer}>
      <Text style={styles.ongoingText}>{caller ? `${caller} (ongoing call)` : 'Ongoing Call'}</Text>
      <Text style={{ marginBottom: 20 }}>Duration: {seconds}s</Text>
      <TouchableOpacity style={styles.reject} onPress={onEnd}>
        <Text style={styles.btnText}>Hang Up</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  const [incomingModalVisible, setIncomingModalVisible] = useState(false);
  const [incomingCaller, setIncomingCaller] = useState<string | null>(null);
  const [currentCallUUID, setCurrentCallUUID] = useState<string>('');
  const [callOngoing, setCallOngoing] = useState(false);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

  // 🟢 1. SETUP RNCallKeep ONLY ONCE
  useEffect(() => {
    const setup = async () => {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS);
      if (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      const options = {
        ios: {
          appName: 'My app name',
        },
        android: {
          alertTitle: 'Permissions required',
          alertDescription: 'This application needs to access your phone accounts',
          cancelButton: 'Cancel',
          okButton: 'Ok',
          imageName: 'phone_account_icon',
          additionalPermissions: [],
          selfManaged: true,
          foregroundService: {
            channelId: 'com.poclibreact',
            channelName: 'VoIP Calls',
            notificationTitle: 'Ongoing Call',
            notificationIcon: 'ic_active_call',
            foregroundServiceType: 'microphone',
          },
        },
      };

      await RNCallKeep.setup(options);
    };

    setup();
  }, []); // Empty dependency array → runs only once!

  // 🟢 2. REGISTER/REMOVE LISTENERS ONCE PER MOUNT
  useEffect(() => {
    // DeviceEventEmitter: custom event for call activation
    const sub = DeviceEventEmitter.addListener('RNCallKeepDidReceiveStartCallAction', ({ callUUID }) => {
      RNCallKeep.setCurrentCallActive(callUUID);
      setCallOngoing(true);
      setCallStartTime(Date.now());
    });

    const onEndCall = ({ callUUID }) => {
      Alert.alert('Call ended!', `UUID: ${callUUID}`);
      setIncomingModalVisible(false);
      setCallOngoing(false);
      setCallStartTime(null);
    };

    RNCallKeep.addEventListener('endCall', onEndCall);

    return () => {
      sub.remove(); // Remove custom event
      RNCallKeep.removeEventListener('endCall', onEndCall); // Remove standard event
    };
  }, []);

  // Simulate push/VoIP notification triggering the modal
  const simulateIncomingCall = () => {
    const uuid = `${Date.now()}`;
    setIncomingCaller('John Doe');
    setCurrentCallUUID(uuid);
    setIncomingModalVisible(true);
  };

  const handleAccept = () => {
    setIncomingModalVisible(false);
    RNCallKeep.startCall(currentCallUUID, '123456789', incomingCaller || 'Unknown');
    // callStartTime and callOngoing are set via event above
  };

  const handleReject = () => {
    setIncomingModalVisible(false);
    setCallOngoing(false);
    setCallStartTime(null);
    if (currentCallUUID) {
      RNCallKeep.endCall(currentCallUUID);
    }
  };

  return (
    <View style={{flex: 1, position: 'relative'}}>
      <View style={styles.container}>
        <Button title="Simulate Incoming Call" onPress={simulateIncomingCall} />
      </View>

      <Modal transparent={true} visible={incomingModalVisible && !callOngoing} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.incomingBox}>
            <Text style={styles.callerName}>{incomingCaller} is calling...</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.accept} onPress={handleAccept}>
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reject} onPress={handleReject}>
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {callOngoing && (
        <OngoingCallScreen
          startTime={callStartTime}
          onEnd={handleReject}
          caller={incomingCaller}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#000a', justifyContent: 'center', alignItems: 'center' },
  incomingBox: { width: 300, backgroundColor: 'white', borderRadius: 10, alignItems: 'center', padding: 20 },
  callerName: { fontWeight: 'bold', fontSize: 20, marginBottom: 24 },
  row: { flexDirection: 'row', marginTop: 20 },
  accept: { backgroundColor: 'green', padding: 15, borderRadius: 10, marginRight: 10 },
  reject: { backgroundColor: 'red', padding: 15, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  ongoingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 99,
  },
  ongoingText: {
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 20,
  },
});
