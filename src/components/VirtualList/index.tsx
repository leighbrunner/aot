import React, { useMemo, useCallback } from 'react';
import {
  FlatList,
  FlatListProps,
  ViewToken,
  ListRenderItem,
} from 'react-native';

interface VirtualListProps<T> extends Omit<FlatListProps<T>, 'getItemLayout'> {
  itemHeight?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  windowSize?: number;
  onViewableItemsChanged?: (info: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => void;
}

export function VirtualList<T>({
  data,
  renderItem,
  itemHeight,
  initialNumToRender = 10,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  windowSize = 21,
  onViewableItemsChanged,
  ...props
}: VirtualListProps<T>) {
  // Optimize getItemLayout if itemHeight is provided
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    return (_: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  // Memoize viewability config
  const viewabilityConfig = useMemo(
    () => ({
      minimumViewTime: 250,
      viewAreaCoveragePercentThreshold: 50,
      waitForInteraction: false,
    }),
    []
  );

  // Optimize render item with memoization
  const memoizedRenderItem: ListRenderItem<T> = useCallback(
    ({ item, index }) => {
      return renderItem ? renderItem({ item, index } as any) : null;
    },
    [renderItem]
  );

  return (
    <FlatList
      {...props}
      data={data}
      renderItem={memoizedRenderItem}
      getItemLayout={getItemLayout}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      windowSize={windowSize}
      removeClippedSubviews={true}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      
      // Performance optimizations
      keyExtractor={(item, index) => 
        (item as any).id || (item as any).imageId || index.toString()
      }
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      
      // Scroll optimizations
      scrollEventThrottle={16}
      decelerationRate="fast"
      
      // Memory optimizations
      persistentScrollbar={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default VirtualList;