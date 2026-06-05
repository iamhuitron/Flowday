import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@store/index';

export default function SettingsScreen() {
  const { settings, updateSettings } = useStore();

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f11]">
      <View className="px-5 pt-4 pb-3 border-b border-[#2e2e38]">
        <Text className="text-[#e8e8f0] text-xl font-semibold">Ajustes</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>

        {/* Profile */}
        <View className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl p-4 mb-4 flex-row items-center gap-4">
          <View className="w-12 h-12 rounded-full bg-[#7c6aff]/20 items-center justify-center">
            <Text className="text-[#7c6aff] text-xl font-semibold">M</Text>
          </View>
          <View>
            <Text className="text-[#e8e8f0] text-base font-semibold">Miguel</Text>
            <Text className="text-[#6b6b7e] text-xs">Informática · UNAM FES C4 · 2° sem</Text>
          </View>
        </View>

        <SettingSection title="NOTIFICACIONES">
          <SettingRow
            label="Recordatorios de hábitos"
            sub="Notificación diaria a las 9am"
            right={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
                trackColor={{ false: '#2e2e38', true: '#7c6aff' }}
                thumbColor="#e8e8f0"
              />
            }
          />
        </SettingSection>

        <SettingSection title="APARIENCIA">
          <SettingRow label="Tema" sub="Oscuro" right={<Chip label="Dark" />} />
          <SettingRow label="Color de acento" sub="#7c6aff" right={
            <View className="w-5 h-5 rounded-full bg-[#7c6aff]" />
          } />
        </SettingSection>

        <SettingSection title="SEMANA">
          <SettingRow label="Primer día" sub="Lunes" right={<Chip label="LUN" />} />
        </SettingSection>

        <SettingSection title="DATOS">
          <SettingRow label="Exportar datos" sub="JSON · próximamente" right={<Text className="text-[#6b6b7e] text-xs">→</Text>} />
          <SettingRow label="Importar desde TimeTune" sub="Próximamente" right={<Text className="text-[#6b6b7e] text-xs">→</Text>} />
        </SettingSection>

        <View className="items-center mt-6">
          <Text className="text-[#6b6b7e] text-xs font-mono">FlowDay v0.1.0</Text>
          <Text className="text-[#2e2e38] text-xs mt-1">github.com/tu-usuario/flowday</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-4">
      <Text className="text-[#6b6b7e] text-xs font-mono tracking-widest mb-2">{title}</Text>
      <View className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function SettingRow({ label, sub, right }: { label: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center px-4 py-3.5 border-b border-[#222228] last:border-0">
      <View className="flex-1">
        <Text className="text-[#e8e8f0] text-sm">{label}</Text>
        {sub && <Text className="text-[#6b6b7e] text-xs mt-0.5">{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View className="bg-[#222228] px-3 py-1 rounded-full">
      <Text className="text-[#6b6b7e] text-xs font-mono">{label}</Text>
    </View>
  );
}
