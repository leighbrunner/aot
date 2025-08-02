import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, ProgressBar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Achievement } from '../../services/api/userStats';

interface AchievementCardProps {
  achievement: Achievement;
  theme: any;
}

export default function AchievementCard({ achievement, theme }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const progress = achievement.progress || 0;
  const target = achievement.target || 1;
  const progressPercent = Math.min(progress / target, 1);

  const getIconForAchievement = (id: string) => {
    switch (id) {
      case 'first-vote': return 'vote';
      case 'centurion': return 'roman-numeral-2';
      case 'week-warrior': return 'calendar-week';
      case 'preference-setter': return 'heart';
      default: return 'trophy';
    }
  };

  return (
    <Surface 
      style={[
        styles.card,
        { 
          backgroundColor: isUnlocked 
            ? theme.colors.primaryContainer 
            : theme.colors.surfaceVariant 
        }
      ]} 
      elevation={1}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={getIconForAchievement(achievement.id) as any}
          size={32}
          color={isUnlocked ? theme.colors.primary : theme.colors.onSurfaceVariant}
        />
        {isUnlocked && (
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={theme.colors.primary}
            style={styles.checkIcon}
          />
        )}
      </View>
      
      <View style={styles.content}>
        <Text 
          variant="titleSmall" 
          style={[
            styles.title,
            { color: isUnlocked ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }
          ]}
        >
          {achievement.name}
        </Text>
        <Text 
          variant="bodySmall" 
          style={[
            styles.description,
            { color: isUnlocked ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }
          ]}
        >
          {achievement.description}
        </Text>
        
        {!isUnlocked && achievement.target && (
          <View style={styles.progressContainer}>
            <ProgressBar 
              progress={progressPercent} 
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="labelSmall" style={styles.progressText}>
              {progress} / {target}
            </Text>
          </View>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  checkIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 2,
  },
  description: {
    opacity: 0.8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    marginTop: 4,
    opacity: 0.7,
  },
});