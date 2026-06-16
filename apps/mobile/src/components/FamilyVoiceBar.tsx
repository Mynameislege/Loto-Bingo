/**
 * FamilyVoiceBar — Barre de chat vocal Salle Famille
 * Utilise le hook useVoiceChat (Agora RTC).
 * S'affiche dans waiting_family et in_game.
 */
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type VoiceChatState } from '@/hooks/useVoiceChat';
import { Colors, Spacing, Radius } from '@/components/ui/tokens';

interface Props {
  voice: VoiceChatState;
}

export default function FamilyVoiceBar({ voice }: Props) {
  if (!voice.available) {
    return (
      <View style={st.unavailable}>
        <Ionicons name="mic-off-outline" size={18} color={Colors.textMuted}/>
        <Text style={st.unavailableTxt}>Chat vocal disponible après rebuild EAS</Text>
      </View>
    );
  }

  return (
    <View style={st.bar}>
      {/* Bouton rejoindre / quitter */}
      <TouchableOpacity
        style={[st.joinBtn, voice.joined && st.joinBtnActive]}
        onPress={voice.joined ? voice.leave : voice.join}
      >
        <Ionicons
          name={voice.joined ? 'headset' : 'headset-outline'}
          size={20}
          color={voice.joined ? '#fff' : Colors.navy}
        />
        <Text style={[st.joinTxt, voice.joined && st.joinTxtActive]}>
          {voice.joined ? 'Connecté' : 'Rejoindre le vocal'}
        </Text>
      </TouchableOpacity>

      {/* Micro mute/unmute */}
      {voice.joined && (
        <TouchableOpacity
          style={[st.muteBtn, voice.muted && st.muteBtnMuted]}
          onPress={voice.toggleMute}
        >
          <Ionicons
            name={voice.muted ? 'mic-off' : 'mic'}
            size={22}
            color={voice.muted ? '#fff' : Colors.navy}
          />
        </TouchableOpacity>
      )}

      {/* Avatars participants */}
      {voice.joined && voice.peers.length > 0 && (
        <View style={st.peers}>
          {voice.peers.map(uid => (
            <View
              key={uid}
              style={[st.peerDot, voice.speakingUid === uid && st.peerSpeaking]}
            >
              <Ionicons
                name="person"
                size={14}
                color={voice.speakingUid === uid ? '#fff' : Colors.textMuted}
              />
            </View>
          ))}
          <Text style={st.peerCount}>{voice.peers.length} en vocal</Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(26,55,108,0.08)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    flexWrap: 'wrap',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Colors.navy,
  },
  joinBtnActive: {
    backgroundColor: Colors.navy,
    borderColor: Colors.navy,
  },
  joinTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  joinTxtActive: {
    color: '#fff',
  },
  muteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteBtnMuted: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  peers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  peerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.woodMid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  peerSpeaking: {
    backgroundColor: Colors.green ?? '#43A047',
    borderWidth: 2,
    borderColor: '#fff',
  },
  peerCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  unavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: Radius.md,
  },
  unavailableTxt: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },
});
