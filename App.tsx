import React, {useEffect, useCallback} from 'react';
import {PermissionsAndroid, View, Button, Alert} from 'react-native';
import RNCallKeep from 'react-native-callkeep';

import {} from 'react-native/Libraries/NewAppScreen';

function App(): React.JSX.Element {
  // Define the requestPermissions function
  const requestPermissions = useCallback(async () => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      console.log('Permission results:', granted);

      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (allGranted) {
        console.log('All required permissions granted');
        setupCallKeep(); // Initial CallKeep when permissions are granted
      } else {
        Alert.alert(
          'Permissions Required',
          'You must grant all permissions to use call functionality.',
        );
      }
    } catch (err) {
      console.warn(err);
    }
  }, []); // No dependencies because we're not using any state or props

  // Initialize CallKeep
  const setupCallKeep = () => {
    const options = {
      ios: {
        appName: 'My app name',
      },
      android: {
        alertTitle: 'Permissions required',
        alertDescription:
          'This application needs to access your phone accounts',
        cancelButton: 'Cancel',
        okButton: 'Ok',
        imageName: 'phone_account_icon',
        additionalPermissions: [],
      },
    };

    RNCallKeep.setup(options);
  };

  // Call requestPermissions in useEffect to perform on component mount
  useEffect(() => {
    async function initCallKeep() {
      await requestPermissions();
      setupCallKeep();
    }

    initCallKeep();
  }, [requestPermissions]);

  RNCallKeep.addEventListener('answerCall', ({callUUID}) => {
    console.log('Answered call with UUID', callUUID);
  });

  RNCallKeep.addEventListener('endCall', ({callUUID}) => {
    console.log('Ended call with UUID', callUUID);
  });

  const handleIncomingCall = () => {
    // Display incoming call when the button is pressed
    RNCallKeep.displayIncomingCall(
      'unique-call-uuid',
      'John Doe',
      '123456789',
      'generic',
      false,
    );
  };
  return (
    <View
      style={
        // eslint-disable-next-line react-native/no-inline-styles
        {flex: 1, justifyContent: 'center', alignItems: 'center'}
      }>
      <Button title="Simulate Incoming Call" onPress={handleIncomingCall} />
    </View>
  );
}

export default App;
