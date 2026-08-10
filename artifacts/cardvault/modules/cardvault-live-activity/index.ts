import { requireNativeModule } from 'expo-modules-core';

// Require the native module registered on the iOS side
const CardVaultLiveActivity = requireNativeModule('CardVaultLiveActivity');

export default CardVaultLiveActivity;
