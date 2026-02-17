// SPENDTRAK CINEMATIC EDITION - Photo Gallery
import React from 'react';
import { View, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { Colors, Spacing, BorderRadius, FontFamily, FontSize } from '../../design/cinematic';
import { GradientText } from '../ui/GradientText';
import { CloseIcon, PlusIcon, CameraIcon } from '../icons';

interface PhotoGalleryProps {
  photos: string[];
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onPhotoPress: (index: number) => void;
  editable?: boolean;
  maxPhotos?: number;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onAddPhoto,
  onRemovePhoto,
  onPhotoPress,
  editable = false,
  maxPhotos = 5,
}) => {
  const canAddMore = photos.length < maxPhotos;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <GradientText variant="bright" style={styles.title}>Photos</GradientText>
        <GradientText variant="muted" style={styles.count}>
          {photos.length}/{maxPhotos}
        </GradientText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gallery}
        contentContainerStyle={styles.galleryContent}
      >
        {photos.map((uri, index) => (
          <Pressable
            key={`photo-${index}`}
            style={styles.photoContainer}
            onPress={() => onPhotoPress(index)}
          >
            <Image source={{ uri }} style={styles.photo} />
            {editable && (
              <Pressable
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onRemovePhoto(index);
                }}
              >
                <CloseIcon size={12} color={Colors.void} />
              </Pressable>
            )}
            <View style={styles.photoOverlay}>
              <GradientText variant="muted" style={styles.photoIndex}>
                {index + 1}
              </GradientText>
            </View>
          </Pressable>
        ))}

        {editable && canAddMore && (
          <Pressable style={styles.addButton} onPress={onAddPhoto}>
            <View style={styles.addButtonInner}>
              <CameraIcon size={24} color={Colors.neon} />
              <GradientText variant="muted" style={styles.addText}>Add</GradientText>
            </View>
          </Pressable>
        )}

        {photos.length === 0 && !editable && (
          <View style={styles.emptyState}>
            <CameraIcon size={32} color={Colors.text.tertiary} />
            <GradientText variant="muted" style={styles.emptyText}>
              No photos attached
            </GradientText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Compact version for list views
export const PhotoThumbnails: React.FC<{
  photos: string[];
  onPress: () => void;
  maxDisplay?: number;
}> = ({ photos, onPress, maxDisplay = 3 }) => {
  if (photos.length === 0) return null;

  const displayPhotos = photos.slice(0, maxDisplay);
  const remaining = photos.length - maxDisplay;

  return (
    <Pressable style={styles.thumbnailsContainer} onPress={onPress}>
      {displayPhotos.map((uri, index) => (
        <Image
          key={`thumb-${index}`}
          source={{ uri }}
          style={[
            styles.thumbnail,
            index > 0 && styles.thumbnailOverlap,
          ]}
        />
      ))}
      {remaining > 0 && (
        <View style={[styles.thumbnail, styles.thumbnailOverlap, styles.thumbnailMore]}>
          <GradientText variant="bright" style={styles.thumbnailMoreText}>
            +{remaining}
          </GradientText>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.semiBold,
  },
  count: {
    fontSize: FontSize.caption,
  },
  gallery: {
    flexDirection: 'row',
  },
  galleryContent: {
    paddingRight: Spacing.md,
  },
  photoContainer: {
    marginRight: Spacing.sm,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.darker,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.void,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: Colors.transparent.deep60,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  photoIndex: {
    fontSize: 10,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent.neon10,
  },
  addButtonInner: {
    alignItems: 'center',
  },
  addText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.caption,
  },
  emptyState: {
    width: 200,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.caption,
  },
  // Thumbnails styles
  thumbnailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.void,
    backgroundColor: Colors.darker,
  },
  thumbnailOverlap: {
    marginLeft: -12,
  },
  thumbnailMore: {
    backgroundColor: Colors.transparent.neon20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailMoreText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
});

export default PhotoGallery;
