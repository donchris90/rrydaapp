import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  colors,
  radii,
  spacing,
  type,
} from '../../theme';
import { GradientBackground } from '../../components/GradientBackground';
import type { AppStackParamList } from '../../navigation/types';

type FormatKey =
  | 'video'
  | 'party'
  | 'audio'
  | 'pk';

type ThemeKey =
  | 'default'
  | 'neon-blue'
  | 'royal-purple'
  | 'sunset-orange'
  | 'emerald-cyber';

const FORMATS: {
  key: FormatKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  subtitle: string;
}[] = [
  {
    key: 'video',
    icon: 'videocam',
    iconColor: '#22D3EE',
    badge: 'Popular',
    badgeColor: 'rgba(255,255,255,0.15)',
    title: 'Video Live',
    subtitle:
      'Broadcast camera with filters',
  },
  {
    key: 'pk',
    icon: 'flash',
    iconColor: colors.pink,
    badge: 'High Coin',
    badgeColor:
      'rgba(255,61,138,0.25)',
    title: 'PK Battle',
    subtitle:
      'Challenge a friend to a 1v1 clash',
  },
  {
    key: 'party',
    icon: 'radio',
    iconColor: '#22D3EE',
    badge: 'Social',
    badgeColor:
      'rgba(255,255,255,0.15)',
    title: 'Party',
    subtitle:
      'Multi-guest voice & video, pick your seat count',
  },
  {
    key: 'audio',
    icon: 'mic',
    iconColor: '#A78BFA',
    title: 'Audio Room',
    subtitle:
      'Voice-only, no camera needed',
  },
];

const THEMES: {
  key: ThemeKey;
  hex?: string;
  name: string;
  subtitle: string;
}[] = [
  {
    key: 'default',
    name: 'Default',
    subtitle:
      'Normal Rryda Live background',
  },
  {
    key: 'neon-blue',
    hex: '#22D3EE',
    name: 'Neon Blue',
    subtitle:
      'Electric Cyberpunk Cyan',
  },
  {
    key: 'royal-purple',
    hex: '#A78BFA',
    name: 'Royal Purple',
    subtitle:
      'Regal Amethyst & Violet',
  },
  {
    key: 'sunset-orange',
    hex: '#FB923C',
    name: 'Sunset Orange',
    subtitle:
      'Warm Golden Horizon',
  },
  {
    key: 'emerald-cyber',
    hex: '#2DD4BF',
    name: 'Emerald Cyber',
    subtitle:
      'Matrix Neon Mint',
  },
];

export function LiveFormatPickerScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<AppStackParamList>
    >();

  const [title, setTitle] =
    useState('');

  const [selectedFormat, setSelectedFormat] =
    useState<FormatKey | null>(null);

  // Default = normal Rryda Live background.
  const [selectedTheme, setSelectedTheme] =
    useState<ThemeKey>('default');

  const showThemeStep =
    selectedFormat === 'video' ||
    selectedFormat === 'party' ||
    selectedFormat === 'audio';

  const selectedThemeData =
    THEMES.find(
      (theme) =>
        theme.key === selectedTheme,
    );

  const isDefaultTheme =
    selectedTheme === 'default';

  const selectedThemeColor =
    selectedThemeData?.hex;

  const handleSelectFormat = (
    key: FormatKey,
  ) => {
    setSelectedFormat(key);

    if (key === 'pk') {
      navigation.navigate('PkScreen');
    }
  };

  const handleGoLive = () => {
    /*
     * DEFAULT:
     * Do not send a custom theme color.
     * This tells the next screen to use the
     * normal Rryda Live background/theme.
     *
     * CUSTOM:
     * Send the selected custom color.
     */

    if (selectedFormat === 'video') {
      navigation.navigate('GoLive', {
        initialTitle: title,
        ...(selectedThemeColor
          ? {
              initialThemeColor:
                selectedThemeColor,
            }
          : {}),
      });

      return;
    }

    if (
      selectedFormat === 'party' ||
      selectedFormat === 'audio'
    ) {
      navigation.navigate('PreRoom', {
        initialMode:
          selectedFormat === 'audio'
            ? 'voice'
            : 'video',

        ...(selectedThemeColor
          ? {
              initialThemeColor:
                selectedThemeColor,
            }
          : {}),
      });
    }
  };

  return (
    <GradientBackground>
      {/* HEADER */}

      <View style={styles.header}>
        <Pressable
          onPress={() =>
            navigation.goBack()
          }
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={
              colors.textPrimary
            }
          />
        </Pressable>

        <Text
          style={styles.headerTitle}
        >
          Choose your live room format
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* LIVE STREAM TITLE */}

        <Text
          style={styles.sectionLabel}
        >
          LIVE STREAM TITLE
        </Text>

        <View
          style={
            styles.titleInputWrap
          }
        >
          <Text
            style={styles.titleEmoji}
          >
            🔥
          </Text>

          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Welcome to my live room! Let's vibe!"
            placeholderTextColor={
              colors.textMuted
            }
            maxLength={60}
          />
        </View>

        {/* BROADCAST FORMAT */}

        <Text
          style={[
            styles.sectionLabel,
            {
              marginTop:
                spacing.lg,
            },
          ]}
        >
          BROADCAST FORMAT
        </Text>

        <View style={styles.grid}>
          {FORMATS.map((f) => {
            const isSelected =
              selectedFormat ===
              f.key;

            return (
              <Pressable
                key={f.key}
                style={[
                  styles.tile,
                  isSelected && {
                    borderColor:
                      colors.primary,
                    backgroundColor:
                      `${colors.primary}14`,
                  },
                ]}
                onPress={() =>
                  handleSelectFormat(
                    f.key,
                  )
                }
              >
                <View
                  style={
                    styles.tileTop
                  }
                >
                  <Ionicons
                    name={f.icon}
                    size={22}
                    color={
                      f.iconColor
                    }
                  />

                  {f.badge && (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            f.badgeColor,
                        },
                      ]}
                    >
                      <Text
                        style={
                          styles.badgeText
                        }
                      >
                        {f.badge}
                      </Text>
                    </View>
                  )}
                </View>

                <Text
                  style={
                    styles.tileTitle
                  }
                >
                  {f.title}
                </Text>

                <Text
                  style={
                    styles.tileSubtitle
                  }
                  numberOfLines={2}
                >
                  {f.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* THEME */}

        {showThemeStep && (
          <>
            <View
              style={[
                styles.sectionRow,
                {
                  marginTop:
                    spacing.lg,
                },
              ]}
            >
              <View
                style={
                  styles.sectionLabelRow
                }
              >
                <Ionicons
                  name="color-palette-outline"
                  size={13}
                  color={
                    colors.primary
                  }
                />

                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  STREAMER THEME
                </Text>
              </View>

              <Text
                style={
                  styles.sectionHint
                }
              >
                Optional
              </Text>
            </View>

            <Text
              style={
                styles.themeDescription
              }
            >
              Choose a custom color for
              your live room, or keep
              Default to use the normal
              Rryda Live background.
            </Text>

            <View
              style={styles.grid}
            >
              {THEMES.map(
                (theme) => {
                  const isSelected =
                    selectedTheme ===
                    theme.key;

                  return (
                    <Pressable
                      key={theme.key}
                      style={[
                        styles.themeTile,
                        isSelected &&
                          !isDefaultTheme &&
                          theme.hex && {
                            borderColor:
                              theme.hex,
                            backgroundColor:
                              `${theme.hex}14`,
                          },
                        isSelected &&
                          isDefaultTheme &&
                          styles.defaultThemeSelected,
                      ]}
                      onPress={() =>
                        setSelectedTheme(
                          theme.key,
                        )
                      }
                    >
                      <View
                        style={
                          styles.themeTop
                        }
                      >
                        {/* DEFAULT = ACTUAL APP BACKGROUND */}

                        {theme.key ===
                        'default' ? (
                          <LinearGradient
                            colors={[
                              colors.primary,
                              colors.pink,
                            ]}
                            start={{
                              x: 0,
                              y: 0,
                            }}
                            end={{
                              x: 1,
                              y: 1,
                            }}
                            style={[
                              styles.themeSwatch,
                              styles.defaultSwatch,
                            ]}
                          >
                            {isSelected && (
                              <View
                                style={
                                  styles.swatchCheck
                                }
                              >
                                <Ionicons
                                  name="checkmark"
                                  size={14}
                                  color="#FFF"
                                />
                              </View>
                            )}
                          </LinearGradient>
                        ) : (
                          <View
                            style={[
                              styles.themeSwatch,
                              {
                                backgroundColor:
                                  theme.hex,
                              },
                            ]}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#FFF"
                              />
                            )}
                          </View>
                        )}

                        <Text
                          style={
                            styles.themeName
                          }
                        >
                          {theme.name}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.themeSubtitle
                        }
                        numberOfLines={1}
                      >
                        {theme.subtitle}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            {/* COMMUNITY GUIDELINES */}

            <View
              style={[
                styles.guidelinesNotice,
                {
                  backgroundColor:
                    `${colors.primary}14`,
                  borderColor:
                    `${colors.primary}40`,
                },
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={
                  colors.primary
                }
              />

              <Text
                style={
                  styles.guidelinesText
                }
              >
                Streamers must follow
                Rryda Live Community &
                safety rules.
              </Text>
            </View>

            {/* GO LIVE */}

            <Pressable
              onPress={
                handleGoLive
              }
              style={
                styles.goLiveWrap
              }
            >
              {isDefaultTheme ? (
                <LinearGradient
                  colors={[
                    colors.primary,
                    colors.pink,
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 0,
                  }}
                  style={
                    styles.goLiveButton
                  }
                >
                  <Text
                    style={
                      styles.goLiveText
                    }
                  >
                    GO LIVE NOW
                  </Text>

                  <Ionicons
                    name="rocket"
                    size={18}
                    color="#FFF"
                  />
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={[
                    selectedThemeColor!,
                    colors.pink,
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 0,
                  }}
                  style={
                    styles.goLiveButton
                  }
                >
                  <Text
                    style={
                      styles.goLiveText
                    }
                  >
                    GO LIVE NOW
                  </Text>

                  <Ionicons
                    name="rocket"
                    size={18}
                    color="#FFF"
                  />
                </LinearGradient>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },

  backButton: {
    padding: spacing.xs,
  },

  headerTitle: {
    ...type.h2,
    color: colors.textPrimary,
  },

  content: {
    paddingHorizontal:
      spacing.md,
    paddingBottom: spacing.xl,
  },

  sectionLabel: {
    ...type.caption,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 1,
  },

  sectionRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom:
      spacing.xs,
  },

  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  sectionHint: {
    ...type.caption,
    color: colors.primary,
    fontWeight: '700',
  },

  themeDescription: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom:
      spacing.xs,
    lineHeight: 16,
  },

  titleInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor:
      'rgba(255,255,255,0.05)',
    borderRadius:
      radii.md,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.1)',
    paddingHorizontal:
      spacing.sm,
    marginTop: spacing.xs,
  },

  titleEmoji: {
    fontSize: 16,
  },

  titleInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical:
      spacing.sm,
    fontSize: 14,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },

  tile: {
    width: '47%',
    backgroundColor:
      'rgba(255,255,255,0.04)',
    borderRadius:
      radii.lg,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    padding: spacing.sm,
  },

  tileTop: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems:
      'flex-start',
  },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius:
      radii.pill,
  },

  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  tileTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
    marginTop:
      spacing.sm,
  },

  tileSubtitle: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  themeTile: {
    width: '47%',
    backgroundColor:
      'rgba(255,255,255,0.04)',
    borderRadius:
      radii.lg,
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
    padding: spacing.sm,
  },

  defaultThemeSelected: {
    borderColor:
      colors.primary,
    backgroundColor:
      `${colors.primary}14`,
  },

  themeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  themeSwatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent:
      'center',
    overflow: 'hidden',
  },

  defaultSwatch: {
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.18)',
  },

  swatchCheck: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      'rgba(0,0,0,0.15)',
  },

  themeName: {
    ...type.bodyStrong,
    color: colors.textPrimary,
    fontSize: 13,
  },

  themeSubtitle: {
    ...type.caption,
    color: colors.textMuted,
    marginTop: 4,
  },

  guidelinesNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius:
      radii.md,
    padding: spacing.sm,
    marginTop:
      spacing.lg,
  },

  guidelinesText: {
    flex: 1,
    ...type.caption,
    color: colors.textSecondary,
  },

  goLiveWrap: {
    borderRadius:
      radii.pill,
    overflow: 'hidden',
    marginTop:
      spacing.md,
  },

  goLiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: spacing.xs,
    paddingVertical:
      spacing.md,
  },

  goLiveText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});