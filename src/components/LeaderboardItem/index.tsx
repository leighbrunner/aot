import React from 'react';
import { View, StyleSheet, Pressable, Share, Platform } from 'react-native';
import { Card, Text, Surface, useTheme, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EnhancedImage from '../EnhancedImage';
import type { LeaderboardItem as LeaderboardItemType } from '../../services/api/leaderboard';
import * as Haptics from 'expo-haptics';

interface LeaderboardItemProps {
  item: LeaderboardItemType;
  rank: number;
  showRankChange?: boolean;
  onPress?: () => void;
}

export default function LeaderboardItem({ 
  item, 
  rank, 
  showRankChange = false,
  onPress 
}: LeaderboardItemProps) {
  const theme = useTheme();
  
  // Medal colors for top 3
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return null;
    }
  };
  
  const medalColor = getMedalColor(rank);
  const winPercentage = Math.round(item.winRate * 100);
  
  const handleShare = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const shareMessage = `Check out ${item.characterName} - ranked #${rank} with ${winPercentage}% win rate! 🏆`;
      
      if (Platform.OS === 'web') {
        // Web share API
        if (navigator.share) {
          await navigator.share({
            title: `${item.characterName} - Rank #${rank}`,
            text: shareMessage,
            url: window.location.href,
          });
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(shareMessage);
          alert('Link copied to clipboard!');
        }
      } else {
        // Mobile share
        await Share.share({
          message: shareMessage,
          title: `${item.characterName} - Rank #${rank}`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Card style={styles.card} mode="elevated">
        <View style={styles.container}>
          {/* Rank */}
          <View style={styles.rankContainer}>
            {medalColor ? (
              <MaterialCommunityIcons
                name="medal"
                size={36}
                color={medalColor}
              />
            ) : (
              <Text variant="headlineSmall" style={styles.rankText}>
                {rank}
              </Text>
            )}
          </View>
          
          {/* Image */}
          <View style={styles.imageContainer}>
            <EnhancedImage
              source={{ uri: item.url }}
              thumbnailSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
            {/* Win rate overlay */}
            <Surface style={[styles.winRateOverlay, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurface }}>
                {winPercentage}%
              </Text>
            </Surface>
          </View>
          
          {/* Info */}
          <View style={styles.infoContainer}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.characterName}>
              {item.characterName}
            </Text>
            
            {/* Categories */}
            <View style={styles.categoriesRow}>
              {item.categories.slice(0, 2).map((category, index) => (
                <Chip 
                  key={index} 
                  compact 
                  style={styles.categoryChip}
                  textStyle={styles.categoryText}
                >
                  {category}
                </Chip>
              ))}
              {item.categories.length > 2 && (
                <Text variant="bodySmall" style={styles.moreCategories}>
                  +{item.categories.length - 2}
                </Text>
              )}
            </View>
            
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name="trophy" 
                  size={16} 
                  color={theme.colors.primary} 
                />
                <Text variant="bodySmall" style={styles.statText}>
                  {item.winCount.toLocaleString()} wins
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <MaterialCommunityIcons 
                  name="vote" 
                  size={16} 
                  color={theme.colors.onSurfaceVariant} 
                />
                <Text variant="bodySmall" style={styles.statText}>
                  {item.voteCount.toLocaleString()} votes
                </Text>
              </View>
            </View>
          </View>
          
          {/* Share button */}
          <IconButton
            icon="share-variant"
            size={20}
            onPress={handleShare}
            style={styles.shareButton}
          />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  winRateOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoContainer: {
    flex: 1,
  },
  characterName: {
    marginBottom: 4,
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  categoryChip: {
    height: 20,
  },
  categoryText: {
    fontSize: 11,
    lineHeight: 14,
  },
  moreCategories: {
    opacity: 0.6,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    opacity: 0.8,
  },
  shareButton: {
    marginLeft: 8,
  },
});