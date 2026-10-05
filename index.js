import { AppRegistry, View, Text } from 'react-native';

// COMPOSANT DE SECOURS (Si tout crash)
const Fallback = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <Text>Erreur de chargement du code.</Text>
    </View>
);

// ENREGISTREMENT IMMEDIAT
AppRegistry.registerComponent('ceggettah', () => {
    try {
        // Chargement différé des librairies pour isoler les crashs
        require('react-native-gesture-handler');
        require('./services/theme/unistyles');

        // On ne charge plus ./translations (ancien i18next)
        // La traduction est maintenant gérée par ./translations/data/translationCentralization

        const AppRoot = require('./appNavigator').default;
        return AppRoot;
    } catch (e) {
        console.error("CRITICAL BOOT ERROR:", e);
        return Fallback;
    }
});
