import { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useDocuments } from '@/hooks/queries/use-documents';
import { useFamilyMembers } from '@/hooks/queries/use-family';
import { DOCUMENT_TYPES } from '@/types/documents';
import type { Document } from '@/types/documents';

const DOC_TYPE_ICONS: Record<string, string> = {
  aadhaar: 'finger-print-outline',
  pan: 'card-outline',
  passport: 'earth-outline',
  voter_id: 'checkmark-circle-outline',
  driving_license: 'car-outline',
  birth_certificate: 'document-text-outline',
  community_certificate: 'people-outline',
  school_certificate: 'school-outline',
  college_certificate: 'school-outline',
  marriage_certificate: 'heart-outline',
  property_document: 'home-outline',
  abha_card: 'medical-outline',
  other: 'document-outline',
};

function getExpiryStatus(expiryDate: string | null): 'expired' | 'expiring' | 'valid' | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  if (expiry < now) return 'expired';
  if (expiry < thirtyDays) return 'expiring';
  return 'valid';
}

function ExpiryBadge({ status }: { status: 'expired' | 'expiring' | null }) {
  if (!status) return null;
  const isExpired = status === 'expired';
  return (
    <View className={`px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
      <Text className={`text-xs font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
        {isExpired ? 'Expired' : 'Expiring Soon'}
      </Text>
    </View>
  );
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();
  const { data: documents, isLoading } = useDocuments(selectedMemberId);
  const { data: familyMembers } = useFamilyMembers();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (type: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const sections = useMemo(() => {
    if (!documents) return [];

    const grouped: Record<string, Document[]> = {};
    for (const doc of documents) {
      const type = doc.document_type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(doc);
    }

    return Object.entries(grouped)
      .map(([type, docs]) => {
        const typeInfo = DOCUMENT_TYPES.find(t => t.value === type);
        return {
          type,
          title: typeInfo?.label || type.replace(/_/g, ' '),
          icon: DOC_TYPE_ICONS[type] || 'document-outline',
          data: collapsedSections.has(type) ? [] : docs,
          count: docs.length,
          isCollapsed: collapsedSections.has(type),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [documents, collapsedSections]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Family Member Filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ id: undefined, label: 'All' }, ...(familyMembers?.map(m => ({ id: m.id, label: m.full_name })) || [])]}
        keyExtractor={(item) => item.id || 'all'}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`mr-2 px-3 py-1.5 rounded-full ${
              selectedMemberId === item.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onPress={() => setSelectedMemberId(item.id)}
          >
            <Text
              className={`text-sm ${
                selectedMemberId === item.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {!documents?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="document-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 text-center">
            No documents found
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              className="flex-row items-center py-3 mt-2"
              onPress={() => toggleSection(section.type)}
            >
              <View className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 justify-center items-center mr-2">
                <Icon name={section.icon} size={18} color="#2563eb" />
              </View>
              <Text className="flex-1 text-gray-900 dark:text-white font-semibold text-base">
                {section.title}
              </Text>
              <View className="bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5 mr-2">
                <Text className="text-gray-600 dark:text-gray-400 text-xs font-medium">{section.count}</Text>
              </View>
              <Icon
                name={section.isCollapsed ? 'chevron-forward' : 'chevron-down'}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
          )}
          renderItem={({ item }) => {
            const expiryStatus = getExpiryStatus(item.expiry_date);
            const showBadge = expiryStatus === 'expired' || expiryStatus === 'expiring';

            return (
              <TouchableOpacity
                className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-2 ml-10 shadow-sm"
                onPress={() => router.push(`/documents/${item.id}`)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    {item.document_number && (
                      <Text className="text-gray-900 dark:text-white font-medium">
                        {item.document_number}
                      </Text>
                    )}
                    {item.issuing_authority && (
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        {item.issuing_authority}
                      </Text>
                    )}
                    <View className="flex-row items-center mt-1 flex-wrap">
                      {item.issue_date && (
                        <Text className="text-gray-400 text-xs mr-3">
                          Issued: {item.issue_date}
                        </Text>
                      )}
                      {item.expiry_date && (
                        <Text className="text-gray-400 text-xs mr-3">
                          Expires: {item.expiry_date}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    {showBadge && <ExpiryBadge status={expiryStatus} />}
                    <Icon name="chevron-forward" size={16} color="#9ca3af" style={{ marginTop: 4 }} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          renderSectionFooter={({ section }) => {
            if (section.isCollapsed) return null;
            return <View className="h-1" />;
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
        onPress={() => router.push('/documents/add')}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
