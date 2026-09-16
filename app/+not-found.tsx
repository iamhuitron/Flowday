import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function NotFoundScreen() {
  const router     = useRouter();
  const { accent } = useTheme();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={[s.iconWrap, { backgroundColor: accent+'18', borderColor: accent+'33' }]}>
          <Text style={s.icon}>⚡</Text>
        </View>
        <Text style={s.code}>404</Text>
        <Text style={s.title}>Pantalla no encontrada</Text>
        <Text style={s.sub}>Esta ruta no existe en FlowDay.</Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={[s.btn, { backgroundColor: accent }]}
          activeOpacity={0.85}
        >
          <Text style={s.btnTxt}>Volver al inicio →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#0c0c0f' },
  content:   { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
  iconWrap:  { width:72, height:72, borderRadius:20, borderWidth:1.5, alignItems:'center', justifyContent:'center', marginBottom:20 },
  icon:      { fontSize:36 },
  code:      { fontFamily: Platform.select({ ios:'Menlo', android:'monospace', default:'monospace' }), fontSize:56, fontWeight:'700', color:'#26262f', marginBottom:4 },
  title:     { fontSize:20, fontWeight:'600', color:'#eeeef5', marginBottom:8 },
  sub:       { fontSize:14, color:'#55556a', marginBottom:32, textAlign:'center' },
  btn:       { paddingHorizontal:28, paddingVertical:13, borderRadius:12 },
  btnTxt:    { fontSize:15, fontWeight:'700', color:'#fff' },
});
