import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/components/ui/tokens';
import LotoBallIcon from '@/components/ui/LotoBallIcon';
import { useGameStore } from '@/stores/gameStore';

export default function TabsLayout() {
  const gameOver    = useGameStore(s => s.gameOver);
  const card        = useGameStore(s => s.card);
  const playedToday = card !== null || gameOver;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.wood,
          borderTopColor: Colors.woodGrain,
          borderTopWidth: 2,
          height: 76,
          paddingBottom: 12,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.textWood,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          title: 'Jouer',
          tabBarIcon: ({ color, size }) => (
            <LotoBallIcon color={color} size={size} playedToday={playedToday} />
          ),
        }}
      />
      <Tabs.Screen
        name="campaign"
        options={{
          title: 'Campagne',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="multiplayer"
        options={{
          title: 'Multi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      {/* Mode Libre accessible depuis l'Accueil — pas de tab dédiée */}
      <Tabs.Screen name="mode-libre" options={{ href: null }} />
      <Tabs.Screen
        name="coupons"
        options={{
          title: 'Coupons',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ticket" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="merchant" options={{ href: null }} />
    </Tabs>
  );
}
