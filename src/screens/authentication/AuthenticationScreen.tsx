import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { fetchKycStatus, submitKyc, type IdType } from '../../api/kyc';
import { useTheme } from '../../context/ThemeContext';
import { GradientButton } from '../../components/GradientButton';

const ID_TYPES: { id: IdType; label: string }[] = [
  { id: 'NIN', label: 'NIN' },
  { id: 'DRIVERS_LICENSE', label: "Driver's licence" },
  { id: 'VOTERS_CARD', label: "Voter's card" },
  { id: 'PASSPORT', label: 'Passport' },
];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // the server's limit per photo

interface Photo {
  uri: string;
  base64: string;
}

// Identity verification. You send your legal name, date of birth, an ID number,
// a photo of the ID and a selfie; a member of staff checks them and approves or
// rejects (with a reason you can act on). You are told the result in the app.
// Withdrawals need a verified identity when the admin has that switched on.
export function AuthenticationScreen() {
  const { palette } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const statusQuery = useQuery({ queryKey: ['kyc'], queryFn: fetchKycStatus, refetchInterval: (q) => (q.state.data?.submission?.status === 'PENDING' ? 20000 : false) });
  const state = statusQuery.data;

  // Keep the signed-in user's "verified" flag in step with the server.
  useEffect(() => {
    if (state?.verified) refreshUser().catch(() => {});
  }, [state?.verified, refreshUser]);

  const [fullName, setFullName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [idType, setIdType] = useState<IdType>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [idPhoto, setIdPhoto] = useState<Photo | null>(null);
  const [selfie, setSelfie] = useState<Photo | null>(null);

  const capture = async (kind: 'id' | 'selfie') => {
    const fromCamera = async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Camera access needed', 'Allow camera access in your phone settings to take this photo.');
      finish(
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.5,
          base64: true,
          cameraType: kind === 'selfie' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
        }),
      );
    };
    const fromLibrary = async () => finish(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true }));
    const finish = (result: ImagePicker.ImagePickerResult) => {
      const asset = result.canceled ? null : result.assets[0];
      if (!asset?.base64) return;
      if ((asset.base64.length * 3) / 4 > MAX_IMAGE_BYTES) {
        return Alert.alert('Photo is too large', 'Please take the photo again a little further away, or in lower light-quality mode.');
      }
      const photo = { uri: asset.uri, base64: asset.base64 };
      if (kind === 'id') setIdPhoto(photo);
      else setSelfie(photo);
    };
    // A selfie has to be taken now; an ID photo can come from the camera or the gallery.
    if (kind === 'selfie') return fromCamera();
    Alert.alert('Photo of your ID', undefined, [{ text: 'Take a photo', onPress: fromCamera }, { text: 'Choose from gallery', onPress: fromLibrary }, { text: 'Cancel', style: 'cancel' }]);
  };

  const submit = useMutation({
    mutationFn: () =>
      submitKyc({
        fullName: fullName.trim(),
        dateOfBirth: `${year.trim().padStart(4, '0')}-${month.trim().padStart(2, '0')}-${day.trim().padStart(2, '0')}`,
        idType,
        idNumber: idNumber.trim(),
        idImage: idPhoto!.base64,
        selfieImage: selfie!.base64,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      setIdPhoto(null);
      setSelfie(null);
    },
    onError: (e: any) => Alert.alert("Couldn't submit", e?.response?.data?.message ?? 'Please check your details and try again.'),
  });

  const ready = fullName.trim().length > 4 && day && month && year.length === 4 && idNumber.trim().length >= 6 && !!idPhoto && !!selfie;
  const card = [styles.card, { backgroundColor: palette.card, borderColor: palette.border }];
  const input = [styles.input, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.surfaceRaised }];

  return (
    <View style={[styles.root, { backgroundColor: palette.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={palette.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: palette.textPrimary }]}>Verify your identity</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        {statusQuery.isLoading ? (
          <ActivityIndicator color={palette.violet} />
        ) : statusQuery.isError ? (
          <Text style={{ color: '#EF4444' }}>Could not load your verification status. Pull back and try again.</Text>
        ) : state?.verified ? (
          <View style={[card, { borderColor: '#10B981' }]}>
            <View style={styles.row}>
              <Ionicons name="shield-checkmark" size={26} color="#10B981" />
              <Text style={[styles.big, { color: palette.textPrimary }]}>Identity verified</Text>
            </View>
            <Text style={[styles.body, { color: palette.textSecondary }]}>Your identity has been checked. You can withdraw your earnings.</Text>
          </View>
        ) : state?.submission?.status === 'PENDING' ? (
          <View style={card}>
            <View style={styles.row}>
              <ActivityIndicator color={palette.violet} />
              <Text style={[styles.big, { color: palette.textPrimary }]}>Under review</Text>
            </View>
            <Text style={[styles.body, { color: palette.textSecondary }]}>
              We received your documents on {new Date(state.submission.submittedAt).toLocaleDateString()} ({ID_TYPES.find((t) => t.id === state.submission!.idType)?.label} ••••{state.submission.idLast4}). You'll get a notification as soon as they've been checked.
            </Text>
          </View>
        ) : (
          <>
            {state?.submission?.status === 'REJECTED' && (
              <View style={[card, { borderColor: '#EF4444' }]}>
                <Text style={[styles.big, { color: '#EF4444' }]}>Not approved</Text>
                <Text style={[styles.body, { color: palette.textPrimary }]}>{state.submission.rejectionReason ?? 'Your documents could not be verified.'}</Text>
                <Text style={[styles.body, { color: palette.textSecondary }]}>Fix that and submit again below.</Text>
              </View>
            )}

            <View style={card}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Your details (exactly as on your ID)</Text>
              <TextInput value={fullName} onChangeText={setFullName} placeholder="Full legal name" placeholderTextColor={palette.textMuted} style={input} autoCapitalize="words" />
              <Text style={[styles.hint, { color: palette.textSecondary }]}>Date of birth</Text>
              <View style={styles.row}>
                <TextInput value={day} onChangeText={(t) => setDay(t.replace(/\D/g, '').slice(0, 2))} placeholder="DD" keyboardType="number-pad" placeholderTextColor={palette.textMuted} style={[...input, { flex: 1 }]} />
                <TextInput value={month} onChangeText={(t) => setMonth(t.replace(/\D/g, '').slice(0, 2))} placeholder="MM" keyboardType="number-pad" placeholderTextColor={palette.textMuted} style={[...input, { flex: 1 }]} />
                <TextInput value={year} onChangeText={(t) => setYear(t.replace(/\D/g, '').slice(0, 4))} placeholder="YYYY" keyboardType="number-pad" placeholderTextColor={palette.textMuted} style={[...input, { flex: 1.6 }]} />
              </View>
            </View>

            <View style={card}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Your ID</Text>
              <View style={styles.chips}>
                {ID_TYPES.map((t) => (
                  <Pressable key={t.id} onPress={() => setIdType(t.id)} style={[styles.chip, { borderColor: idType === t.id ? palette.violet : palette.border, backgroundColor: idType === t.id ? 'rgba(123,66,246,0.12)' : 'transparent' }]}>
                    <Text style={{ color: idType === t.id ? palette.violet : palette.textPrimary, fontWeight: '800', fontSize: 12 }}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput value={idNumber} onChangeText={setIdNumber} placeholder={idType === 'NIN' ? 'NIN (11 digits)' : 'ID number'} keyboardType={idType === 'NIN' ? 'number-pad' : 'default'} autoCapitalize="characters" placeholderTextColor={palette.textMuted} style={input} />
            </View>

            <View style={card}>
              <Text style={[styles.label, { color: palette.textSecondary }]}>Photos</Text>
              <View style={styles.row}>
                <PhotoTile title="Photo of your ID" hint="All four corners, text readable" photo={idPhoto} onPress={() => capture('id')} palette={palette} />
                <PhotoTile title="Selfie" hint="Your face, holding your ID" photo={selfie} onPress={() => capture('selfie')} palette={palette} />
              </View>
            </View>

            <GradientButton label={submit.isPending ? 'Sending...' : 'Submit for review'} loading={submit.isPending} disabled={!ready} onPress={() => submit.mutate()} />
            <Text style={[styles.hint, { color: palette.textMuted }]}>
              Only our verification team can see your documents, and only to check who you are. The photos are deleted 7 days after they have been reviewed, and we keep just the last 4 digits of your ID number. You must be 18 or older.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PhotoTile({ title, hint, photo, onPress, palette }: { title: string; hint: string; photo: Photo | null; onPress: () => void; palette: any }) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, { borderColor: photo ? '#10B981' : palette.border, backgroundColor: palette.surfaceRaised }]}>
      {photo ? (
        <Image source={{ uri: photo.uri }} style={styles.preview} />
      ) : (
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Ionicons name="camera-outline" size={26} color={palette.textMuted} />
          <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: 12, textAlign: 'center' }}>{title}</Text>
          <Text style={{ color: palette.textMuted, fontSize: 10, textAlign: 'center' }}>{hint}</Text>
        </View>
      )}
      {photo && <Text style={{ color: palette.textSecondary, fontSize: 10, marginTop: 4 }}>Tap to retake</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  title: { fontSize: 20, fontWeight: '900' },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  big: { fontSize: 17, fontWeight: '900' },
  body: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '800' },
  hint: { fontSize: 11, lineHeight: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  tile: { flex: 1, minHeight: 150, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 8 },
  preview: { width: '100%', height: 120, borderRadius: 10 },
});
