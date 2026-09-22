import { AnnouncementBanner } from '../../components/AnnouncementBanner';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOpenRooms, fetchMyInvites, fetchRoomDetails, acceptInvite, declineInvite, PartyRoom, type RoomInvite } from '../../api/rooms';
import { GradientBackground } from '../../components/GradientBackground';
import { PressableScale } from '../../components/PressableScale';
import { Avatar } from '../../components/Avatar';
import { FadeInUp } from '../../components/FadeInUp';
import { useTheme } from '../../context/ThemeContext';
import { gradients, radii, spacing, type } from '../../theme';
import type { AppStackParamList } from '../../navigation/types';

type ModeTab = 'all' | 'video' | 'voice';

export function PartyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const { palette, isMidnight } = useTheme();
  const [activeTab, setActiveTab] = useState<ModeTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [invitesOpen, setInvitesOpen] = useState(false);

  const roomsQuery = useQuery({ queryKey: ['rooms', 'open'], queryFn: fetchOpenRooms, refetchInterval: 8000 });
  const invitesQuery = useQuery({ queryKey: ['rooms', 'invites'], queryFn: fetchMyInvites, refetchInterval: 15000 });


  const acceptMutation = useMutation({
    mutationFn: async (invite: RoomInvite) => {
      const room = await fetchRoomDetails(invite.roomId);
      const seatNumber = Array.from({ length: room.seatCount }, (_, i) => i).find(i => !room.seats.some(s => s.seatNumber === i));
      if (seatNumber == null) throw new Error('That room is full now.');
      await acceptInvite(invite.roomId, seatNumber);
      return invite.roomId;
    },
    onSuccess: (roomId) => { queryClient.invalidateQueries({ queryKey: ['rooms', 'invites'] }); setInvitesOpen(false); navigation.navigate('Room', { roomId }); },
    onError: (error: any) => Alert.alert('Could not join', error?.response?.data?.message ?? error?.message ?? 'Something went wrong'),
  });

  const declineMutation = useMutation({
    mutationFn: (requestId: string) => declineInvite(requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms', 'invites'] }),
  });

  const rooms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (roomsQuery.data ?? []).filter((room) => {
      if (activeTab === 'video' && room.mode && room.mode !== 'VIDEO') return false;
      if (activeTab === 'voice' && room.mode && room.mode !== 'AUDIO') return false;
      if (!q) return true;
      return `${room.title} ${room.id}`.toLowerCase().includes(q);
    });
  }, [roomsQuery.data, activeTab, searchQuery]);

  const refresh = async () => { setRefreshing(true); await roomsQuery.refetch(); setRefreshing(false); };

  const renderRoom = ({ item, index }: { item: PartyRoom; index: number }) => {
    const isVideo = String((item as any).mode ?? '').toUpperCase().includes('VIDEO');
    const cover = isVideo ? ['#FF2E7E', '#7B42F6'] as const : ['#00C4FF', '#7B42F6'] as const;
    return (
      <FadeInUp index={index} style={styles.cardWrap}>
        <PressableScale style={[styles.roomCard, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => navigation.navigate('Room', { roomId: item.id })}>
          <LinearGradient colors={cover} style={styles.cardAccent} start={{x:0,y:0}} end={{x:1,y:1}} />
          <View style={styles.cardTop}>
            <View style={styles.modeBadge}>
              <Ionicons name={isVideo ? 'videocam' : 'mic'} size={12} color="#fff" />
              <Text style={styles.modeText}>{isVideo ? 'VIDEO PARTY' : 'AUDIO LOUNGE'}</Text>
            </View>
            <View style={[styles.livePill, { backgroundColor: palette.primaryLight }]}><View style={[styles.liveDot, { backgroundColor: palette.live }]} /><Text style={[styles.liveText, { color: palette.primary }]}>LIVE</Text></View>
          </View>
          <View style={styles.cardBody}>
            <Avatar name={item.title} size={48} />
            <View style={styles.info}>
              <Text style={[styles.title, { color: palette.textPrimary }]} numberOfLines={2}>{item.title || 'Party Room'}</Text>
              <Text style={[styles.meta, { color: palette.textSecondary }]} numberOfLines={1}>{item.privacy.replace('_', ' ')} · {item.seatCount} seats</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
          </View>
        </PressableScale>
      </FadeInUp>
    );
  };

  return (
    <GradientBackground>
      <View style={[styles.header, { paddingTop: 12, backgroundColor: isMidnight ? 'rgba(11,8,20,.92)' : 'rgba(255,255,255,.92)', borderBottomColor: palette.borderLight }]}> 
        <View>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Party Live</Text>
          <Text style={[styles.headerSub, { color: palette.textSecondary }]}>Video & Audio Social Lounges</Text>
        </View>
        <View style={styles.headerActions}>
          <PressableScale style={[styles.inviteButton, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => setInvitesOpen(true)}>
            <Ionicons name="mail-unread-outline" size={18} color={palette.primary} />
            {!!(invitesQuery.data?.length) && <View style={styles.badge}><Text style={styles.badgeText}>{invitesQuery.data.length}</Text></View>}
          </PressableScale>
          <PressableScale onPress={() => navigation.navigate('LiveFormatPicker')}>
            <LinearGradient colors={gradients.hero} style={styles.startButton} start={{x:0,y:0}} end={{x:1,y:0}}>
              <Ionicons name="add" size={18} color="#fff" /><Text style={styles.startText}>Start</Text>
            </LinearGradient>
          </PressableScale>
        </View>
      </View>

      <AnnouncementBanner />

      <View style={styles.filters}>
        {([['all','All Parties'],['video','📹 Video Parties'],['voice','🎙️ Audio Lounges']] as const).map(([id,label]) => {
          const active = activeTab === id;
          return <Pressable key={id} onPress={() => setActiveTab(id)} style={[styles.tab, active && { backgroundColor: palette.primaryLight, borderColor: palette.primary }]}><Text style={[styles.tabText, { color: active ? palette.primary : palette.textSecondary }]}>{label}</Text></Pressable>;
        })}
      </View>

      <View style={[styles.searchWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Ionicons name="search" size={17} color={palette.textMuted} />
        <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search party rooms, hosts, categories..." placeholderTextColor={palette.textMuted} style={[styles.search, { color: palette.textPrimary }]} />
        {searchQuery ? <Pressable onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={17} color={palette.textMuted} /></Pressable> : null}
      </View>

      <FlatList data={rooms} keyExtractor={item => item.id} renderItem={renderRoom} numColumns={1} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} />} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.empty}><Ionicons name="mic-outline" size={42} color={palette.textMuted}/><Text style={[styles.emptyTitle,{color:palette.textPrimary}]}>No party rooms found</Text><Text style={[styles.emptySub,{color:palette.textSecondary}]}>Create a room and start the conversation.</Text></View>} />



      <Modal visible={invitesOpen} transparent animationType="slide" onRequestClose={() => setInvitesOpen(false)}>
        <View style={styles.modalOverlay}><View style={[styles.modalCard,{backgroundColor:palette.surface,maxHeight:'70%'}]}>
          <View style={styles.modalHeader}><Text style={[styles.modalTitle,{color:palette.textPrimary}]}>Party Invites</Text><Pressable onPress={() => setInvitesOpen(false)}><Ionicons name="close" size={22} color={palette.textSecondary}/></Pressable></View>
          <FlatList data={invitesQuery.data ?? []} keyExtractor={(x:any)=>x.requestId} ListEmptyComponent={<Text style={{color:palette.textSecondary,textAlign:'center',padding:24}}>No pending invites.</Text>} renderItem={({item})=><View style={[styles.inviteRow,{borderBottomColor:palette.borderLight}]}><View style={{flex:1}}><Text style={{color:palette.textPrimary,fontWeight:'800'}}>{item.roomTitle ?? 'Party invitation'}</Text><Text style={{color:palette.textMuted,fontSize:12}}>You were invited to join this room.</Text></View><Pressable onPress={()=>declineMutation.mutate(item.requestId)}><Text style={{color:palette.textSecondary,fontWeight:'700'}}>Decline</Text></Pressable><Pressable onPress={()=>acceptMutation.mutate(item)} style={{marginLeft:14}}><Text style={{color:palette.primary,fontWeight:'800'}}>Join</Text></Pressable></View>} />
        </View></View>
      </Modal>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header:{paddingHorizontal:spacing.md,paddingBottom:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1}, headerTitle:{...type.h1}, headerSub:{...type.caption,marginTop:3}, headerActions:{flexDirection:'row',alignItems:'center',gap:8}, inviteButton:{width:40,height:40,borderRadius:20,borderWidth:1,alignItems:'center',justifyContent:'center'}, badge:{position:'absolute',right:-3,top:-3,minWidth:16,height:16,borderRadius:8,backgroundColor:'#FF2D55',alignItems:'center',justifyContent:'center'},badgeText:{color:'#fff',fontSize:9,fontWeight:'900'},startButton:{height:40,paddingHorizontal:15,borderRadius:20,flexDirection:'row',alignItems:'center',gap:5},startText:{color:'#fff',fontWeight:'900',fontSize:13}, filters:{flexDirection:'row',paddingHorizontal:spacing.md,paddingVertical:10,gap:8},tab:{paddingHorizontal:13,paddingVertical:9,borderRadius:radii.pill,borderWidth:1,borderColor:'transparent'},tabText:{fontSize:12,fontWeight:'800'},searchWrap:{marginHorizontal:spacing.md,marginBottom:10,height:42,borderRadius:13,borderWidth:1,flexDirection:'row',alignItems:'center',paddingHorizontal:12,gap:8},search:{flex:1,fontSize:13,paddingVertical:0},list:{paddingHorizontal:spacing.md,paddingBottom:110},cardWrap:{marginBottom:10},roomCard:{borderRadius:18,borderWidth:1,overflow:'hidden',minHeight:132},cardAccent:{height:4},cardTop:{paddingHorizontal:12,paddingTop:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},modeBadge:{backgroundColor:'rgba(20,18,30,.88)',paddingHorizontal:8,paddingVertical:5,borderRadius:8,flexDirection:'row',alignItems:'center',gap:4},modeText:{color:'#fff',fontSize:9,fontWeight:'900'},livePill:{paddingHorizontal:7,paddingVertical:5,borderRadius:8,flexDirection:'row',alignItems:'center',gap:4},liveDot:{width:6,height:6,borderRadius:3},liveText:{fontSize:9,fontWeight:'900'},cardBody:{padding:12,flexDirection:'row',alignItems:'center',gap:12},info:{flex:1},title:{fontSize:15,fontWeight:'900'},meta:{fontSize:11,fontWeight:'600',marginTop:4},empty:{alignItems:'center',paddingTop:70},emptyTitle:{fontSize:17,fontWeight:'900',marginTop:12},emptySub:{fontSize:13,marginTop:5},modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,.55)',justifyContent:'flex-end'},modalCard:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:20},modalHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},modalTitle:{fontSize:20,fontWeight:'900'},modalInput:{height:48,borderWidth:1,borderRadius:12,paddingHorizontal:14,marginTop:16},modalActions:{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:12,marginTop:16},cancel:{paddingHorizontal:10,paddingVertical:12},createCta:{paddingHorizontal:18,paddingVertical:12,borderRadius:14},createCtaText:{color:'#fff',fontWeight:'900'},inviteRow:{flexDirection:'row',alignItems:'center',paddingVertical:14,borderBottomWidth:1}
});
