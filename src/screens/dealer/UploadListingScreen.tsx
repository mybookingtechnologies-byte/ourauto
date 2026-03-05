import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';

import { Header } from '../../components/Header';
import { useUploadListing } from '../../hooks/useListings';
import { getTheme } from '../../utils/constants';

type FormState = {
  title: string;
  price: string;
  brand: string;
  model: string;
  year: string;
  fuelType: string;
  location: string;
  description: string;
};

const initialForm: FormState = {
  title: '',
  price: '',
  brand: '',
  model: '',
  year: '',
  fuelType: '',
  location: '',
  description: '',
};

export const UploadListingScreen = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [images, setImages] = useState<string[]>([]);
  const uploadMutation = useUploadListing();
  const router = useRouter();
  const theme = getTheme(useColorScheme());

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to upload listing images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });

    if (result.canceled) {
      return;
    }

    setImages(result.assets.map((asset) => asset.uri));
  };

  const onSubmit = async () => {
    const values = Object.values(form).map((value) => value.trim());
    const hasEmpty = values.some((value) => !value);

    if (hasEmpty || images.length === 0) {
      Alert.alert('Incomplete form', 'Please fill all fields and add at least one image.');
      return;
    }

    try {
      await uploadMutation.mutateAsync({ ...form, images });
      Alert.alert('Success', 'Listing uploaded successfully.');
      setForm(initialForm);
      setImages([]);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed.';
      Alert.alert('Upload failed', message);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Upload Listing" subtitle="Add a new car to marketplace" />

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {[
          ['title', 'Title'],
          ['price', 'Price'],
          ['brand', 'Brand'],
          ['model', 'Model'],
          ['year', 'Year'],
          ['fuelType', 'Fuel Type'],
          ['location', 'Location'],
          ['description', 'Description'],
        ].map(([field, label]) => (
          <View key={field} style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <TextInput
              value={form[field as keyof FormState]}
              onChangeText={(value) => onChange(field as keyof FormState, value)}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder={label}
              placeholderTextColor={theme.mutedText}
              multiline={field === 'description'}
              numberOfLines={field === 'description' ? 4 : 1}
            />
          </View>
        ))}

        <Pressable style={[styles.secondaryButton, { borderColor: theme.primary }]} onPress={pickImages}>
          <Text style={[styles.secondaryText, { color: theme.primary }]}>Pick Images ({images.length})</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewRow}>
          {images.map((uri) => (
            <Image key={uri} source={{ uri }} style={styles.previewImage} />
          ))}
        </ScrollView>

        <Pressable
          style={[styles.submitButton, { backgroundColor: theme.primary, opacity: uploadMutation.isPending ? 0.6 : 1 }]}
          onPress={onSubmit}
          disabled={uploadMutation.isPending}
        >
          <Text style={styles.submitText}>{uploadMutation.isPending ? 'Uploading...' : 'Submit Listing'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewRow: {
    gap: 8,
    paddingVertical: 6,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  submitButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
