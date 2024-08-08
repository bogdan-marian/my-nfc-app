# readme

```bash
# home pc1
export ANDROID_HOME="/home/bogdan/Android/Sdk"
# mac m2
export ANDROID_HOME="/Users/bogdan/Library/Android/sdk"
export PATH=$ANDROID_HOME/platform-tools:$PATH
npx expo run:android

npx expo start

```

run custom code: https://docs.expo.dev/workflow/customizing/

# tutoraial
- create modal: https://docs.expo.dev/tutorial/create-a-modal/

# notes before commit
```javascript
"plugins": [
      "react-native-nfc-manager",
      {
        "nfcPermission": "Allow $(PRODUCT_NAME) to interact with NFC devices.",
        "selectIdentifiers": ["A0000002471001"],
        "systemCodes": ["8008"],
        "includeNdefEntitlement": true
      }
    ]
```