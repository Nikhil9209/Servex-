import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { colors, fonts } from '../theme/tokens';
import { CountryCodeItem } from '../types/auth';

export const SUPPORTED_COUNTRIES: CountryCodeItem[] = [
  {
    name: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    minLength: 10,
    maxLength: 10,
  },
  {
    name: 'United States',
    code: 'US',
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: '555 123 4567',
    minLength: 10,
    maxLength: 10,
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    minLength: 10,
    maxLength: 10,
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    dialCode: '+971',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    minLength: 9,
    maxLength: 9,
  },
  {
    name: 'Australia',
    code: 'AU',
    dialCode: '+61',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    minLength: 9,
    maxLength: 9,
  },
  {
    name: 'Singapore',
    code: 'SG',
    dialCode: '+65',
    flag: '🇸🇬',
    placeholder: '9123 4567',
    minLength: 8,
    maxLength: 8,
  },
  {
    name: 'Germany',
    code: 'DE',
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '151 12345678',
    minLength: 10,
    maxLength: 11,
  },
  {
    name: 'Canada',
    code: 'CA',
    dialCode: '+1',
    flag: '🇨🇦',
    placeholder: '416 123 4567',
    minLength: 10,
    maxLength: 10,
  },
];

interface CountryCodePickerProps {
  selectedCountry: CountryCodeItem;
  onSelectCountry: (country: CountryCodeItem) => void;
  disabled?: boolean;
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  selectedCountry,
  onSelectCountry,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = SUPPORTED_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          pressed && !disabled && styles.triggerPressed,
          disabled && styles.triggerDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        hitSlop={6}
      >
        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Country</Text>
                <Text style={styles.modalSubtitle}>Choose your country code</Text>
              </View>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                hitSlop={8}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code..."
                placeholderTextColor={colors.inputPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code + item.dialCode}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.countryItem,
                      isSelected && styles.countryItemSelected,
                      pressed && styles.countryItemPressed,
                    ]}
                    onPress={() => {
                      onSelectCountry(item);
                      setModalVisible(false);
                      setSearchQuery('');
                    }}
                  >
                    <View style={styles.countryLeft}>
                      <Text style={styles.countryFlag}>{item.flag}</Text>
                      <Text style={styles.countryName}>{item.name}</Text>
                    </View>
                    <View style={styles.countryRight}>
                      <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161920',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#252932',
    minWidth: 84,
    justifyContent: 'center',
  },
  triggerPressed: {
    backgroundColor: '#1F242F',
  },
  triggerDisabled: {
    opacity: 0.6,
  },
  flagText: {
    fontSize: 16,
    marginRight: 6,
  },
  dialCodeText: {
    fontFamily: fonts.bodyMedium,
    color: '#FFFFFF',
    fontSize: 14,
  },
  chevron: {
    color: '#8B8F95',
    fontSize: 11,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F1116',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#20242D',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 17,
  },
  modalSubtitle: {
    fontFamily: fonts.body,
    color: '#8B8F95',
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1B1E26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#8B8F95',
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161920',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#232730',
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: '#FFFFFF',
    fontFamily: fonts.body,
    fontSize: 14,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  countryItemSelected: {
    backgroundColor: 'rgba(26, 115, 232, 0.12)',
  },
  countryItemPressed: {
    backgroundColor: '#1B1E26',
  },
  countryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  countryName: {
    fontFamily: fonts.body,
    color: '#FFFFFF',
    fontSize: 14,
  },
  countryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryDialCode: {
    fontFamily: fonts.bodyMedium,
    color: '#8B8F95',
    fontSize: 13,
  },
  checkMark: {
    color: '#1A73E8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#1A1D24',
  },
});
