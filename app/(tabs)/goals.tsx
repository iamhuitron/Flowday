import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@store/index';

const PHASES = [
  { id: '0', name: 'F1 · Fundamentos', color: '#60a5fa', sem: 'Sem 2–3',
    milestone: 'GitHub con 3+ proyectos, área elegida',
    objectives: [
      'Completar CS50P de Harvard (Python)',
      'Resolver 30 ejercicios en LeetCode nivel Easy',
      'Crear cuenta y subir primer proyecto a GitHub',
      'Construir script de automatización personal',
      'Ver 2h/semana de YouTube tech en inglés',
      'Probar web (HTML/CSS/JS básico)',
      'Probar datos (tutorial Kaggle Intro to ML)',
      'Probar seguridad (TryHackMe Pre-Security)',
      'Elegir área de especialización',
    ]},
  { id: '1', name: 'F2 · Especialización', color: '#4ade80', sem: 'Sem 3–4',
    milestone: 'Primer proyecto serio publicado, inglés fluido lectura/escritura',
    objectives: [
      'Completar curso React (Scrimba o freeCodeCamp)',
      'Aprender Node.js + Express básico',
      'Completar NumPy y Pandas fundamentals',
      'Completar curso ML Andrew Ng (Coursera)',
      'Terminar TryHackMe SOC Level 1',
      'Publicar proyecto con base de datos en línea',
      'Subir primer proyecto serio a GitHub',
      'Primera competencia Kaggle completada',
      'Leer documentación técnica solo en inglés',
    ]},
  { id: '2', name: 'F3 · Certificación', color: '#fbbf24', sem: 'Sem 4–5',
    milestone: '1 cert cloud, ingreso freelance, práctica profesional',
    objectives: [
      'Obtener AWS Cloud Practitioner',
      'Completar Google Cloud Skills Boost (5 insignias)',
      'Primer proyecto freelance pagado',
      'Aplicar a prácticas profesionales',
      'Contribuir a proyecto open source en GitHub',
      'Iniciar inglés conversacional (Italki/Cambly)',
      'LinkedIn con perfil técnico completo',
    ]},
  { id: '3', name: 'F4 · Junior', color: '#a78bfa', sem: 'Sem 5–7',
    milestone: 'Primer trabajo formal, 2+ certs, portafolio sólido',
    objectives: [
      'Dominar TypeScript (o stack de tu área)',
      'Docker y despliegue en producción',
      'Segunda certificación cloud (Associate level)',
      'Escribir 5 artículos técnicos publicados',
      'GitHub con commits diarios por 3+ meses',
      'Primer trabajo de tiempo parcial en tech',
      'Inglés conversacional en entrevistas técnicas',
    ]},
  { id: '4', name: 'F5 · Internacional', color: '#f87171', sem: 'Sem 8–9',
    milestone: 'Posición junior–mid, opción internacional real',
    objectives: [
      'Aplicar a plataformas nearshore (Toptal, Turing)',
      'AWS Solutions Architect Associate o equivalente',
      'Inglés fluido en reuniones técnicas',
      'Portafolio con 8+ proyectos documentados',
      'Investigar posgrado/intercambio UNAM',
      'Primera entrevista técnica en inglés',
    ]},
];

export default function GoalsScreen() {
  const { objectives, toggleObjective, getGlobalProgress } = useStore();
  const globalPct = getGlobalProgress();

  return (
    <SafeAreaView className="flex-1 bg-[#0f0f11]">
      <View className="px-5 pt-4 pb-3 border-b border-[#2e2e38] flex-row items-center justify-between">
        <Text className="text-[#e8e8f0] text-xl font-semibold">Metas</Text>
        <View className="items-end">
          <Text className="text-[#7c6aff] text-lg font-semibold font-mono">{globalPct}%</Text>
          <Text className="text-[#6b6b7e] text-xs">progreso global</Text>
        </View>
      </View>

      {/* Global progress bar */}
      <View className="h-1 bg-[#1a1a1f]">
        <View
          className="h-full bg-[#7c6aff]"
          style={{ width: `${globalPct}%` }}
        />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {PHASES.map((phase) => {
          const done = phase.objectives.filter((_, i) => objectives[`${phase.id}-${i}`]).length;
          const pct  = Math.round((done / phase.objectives.length) * 100);

          return (
            <View key={phase.id} className="bg-[#1a1a1f] border border-[#2e2e38] rounded-xl p-4 mb-4">
              {/* Phase header */}
              <View className="flex-row items-center gap-3 mb-2">
                <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: phase.color }} />
                <Text className="text-[#e8e8f0] text-sm font-semibold flex-1">{phase.name}</Text>
                <Text className="text-xs font-mono" style={{ color: phase.color }}>{pct}%</Text>
              </View>
              <Text className="text-[#6b6b7e] text-xs mb-3">{phase.sem}</Text>

              {/* Progress bar */}
              <View className="h-1 bg-[#222228] rounded-full mb-4">
                <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: phase.color }} />
              </View>

              {/* Objectives */}
              {phase.objectives.map((obj, i) => {
                const key  = `${phase.id}-${i}`;
                const done = objectives[key] ?? false;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleObjective(key)}
                    className="flex-row items-start gap-3 py-2.5 border-b border-[#222228]"
                  >
                    <View className="w-4 h-4 rounded mt-0.5 items-center justify-center border"
                      style={{
                        borderColor: done ? phase.color : '#2e2e38',
                        backgroundColor: done ? phase.color + '20' : 'transparent',
                      }}
                    >
                      {done && <Text style={{ color: phase.color, fontSize: 9 }}>✓</Text>}
                    </View>
                    <Text className={`text-sm flex-1 leading-relaxed ${
                      done ? 'text-[#6b6b7e] line-through' : 'text-[#e8e8f0]'
                    }`}>
                      {obj}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Milestone */}
              <View className="mt-4 px-3 py-2.5 rounded-lg bg-[#222228] border-l-2" style={{ borderLeftColor: phase.color }}>
                <Text className="text-[#6b6b7e] text-xs">🎯 {phase.milestone}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
