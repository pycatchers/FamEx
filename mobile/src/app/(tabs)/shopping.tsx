import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useRecentShops, useDrafts, useDeleteDraft } from '@/hooks/queries/use-shopping';
import { RecentShop, BillDraft } from '@/types/shopping';
import { useState } from 'react';

const DRAFT_ENTRY_ROUTES: Record<string, string> = {
  manual: '/shopping/add-bill',
  ocr: '/shopping/ocr-bill',
  voice: '/shopping/voice-bill',
};

const DRAFT_ENTRY_LABELS: Record<string, string> = {
  manual: 'Manual entry',
  ocr: 'Scanned bill',
  voice: 'Voice entry',
};

const formatDate = (d: string | null) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function ShopCard({ shop, onPress }: { shop: RecentShop; onPress: () => void }) {
  const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
            {shop.name}
          </Text>
          {shop.address ? (
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
              {shop.address}
            </Text>
          ) : null}
          <View className="flex-row items-center mt-1.5 gap-3">
            {shop.last_visit_date ? (
              <View className="flex-row items-center gap-1">
                <Icon name="calendar-outline" size={12} color="#9ca3af" />
                <Text className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(shop.last_visit_date)}
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-center gap-1">
              <Icon name="receipt-outline" size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400 dark:text-gray-500">
                {shop.bill_count} {shop.bill_count === 1 ? 'bill' : 'bills'}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(shop.total_spent)}
          </Text>
          <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">total spent</Text>
          <Icon name="chevron-forward" size={16} color="#9ca3af" style={{ marginTop: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ShoppingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: shops, isLoading, refetch } = useRecentShops();
  const { data: drafts } = useDrafts();
  const deleteDraft = useDeleteDraft();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const resumeDraft = (draft: BillDraft) => {
    setShowAddMenu(false);
    const route = DRAFT_ENTRY_ROUTES[draft.entry_method] ?? '/shopping/add-bill';
    router.push({ pathname: route, params: { draftId: draft.id } } as any);
  };

  const confirmDeleteDraft = (draft: BillDraft) => {
    Alert.alert('Discard Draft', 'This in-progress bill will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => deleteDraft.mutate(draft.id) },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">Shopping</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Recently visited shops</Text>
        </View>
        <TouchableOpacity
          className="bg-white dark:bg-gray-800 rounded-xl px-3 py-2 flex-row items-center gap-1.5 shadow-sm"
          onPress={() => router.push('/shopping/checklists' as any)}
        >
          <Icon name="list-outline" size={18} color="#2563eb" />
          <Text className="text-primary-600 dark:text-primary-400 text-sm font-medium">Lists</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={shops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <ShopCard
            shop={item}
            onPress={() => router.push({ pathname: '/shopping/shop-detail', params: { shopId: item.id, shopName: item.name } } as any)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Icon name="storefront-outline" size={56} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
                No shop visits yet.{'\n'}Scan a bill to get started.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        className="absolute right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
        style={{ bottom: 32 + insets.bottom }}
        onPress={() => setShowAddMenu(true)}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add Bill Options Modal */}
      <Modal visible={showAddMenu} transparent animationType="slide" onRequestClose={() => setShowAddMenu(false)}>
        <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={() => setShowAddMenu(false)} />
        <View className="bg-white dark:bg-gray-900 rounded-t-2xl px-6 pt-4" style={{ paddingBottom: Math.max(40, 24 + insets.bottom) }}>
          <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-6" />

          {(drafts?.length ?? 0) > 0 && (
            <View className="mb-4">
              <Text className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">
                Resume Draft
              </Text>
              {drafts!.map((draft) => (
                <View
                  key={draft.id}
                  className="flex-row items-center bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-2"
                >
                  <TouchableOpacity className="flex-1 flex-row items-center" onPress={() => resumeDraft(draft)}>
                    <View className="w-9 h-9 bg-amber-500 rounded-full items-center justify-center mr-3">
                      <Icon name="document-text-outline" size={18} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900 dark:text-white">
                        {DRAFT_ENTRY_LABELS[draft.entry_method] ?? 'Draft'}
                      </Text>
                      <Text className="text-xs text-gray-500 dark:text-gray-400">
                        Last edited {formatDate(draft.updated_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity className="p-2" onPress={() => confirmDeleteDraft(draft)}>
                    <Icon name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Bill</Text>

          <TouchableOpacity
            className="flex-row items-center bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-3"
            onPress={() => { setShowAddMenu(false); router.push('/shopping/ocr-bill' as any); }}
          >
            <View className="w-10 h-10 bg-primary-600 rounded-full items-center justify-center mr-4">
              <Icon name="camera" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 dark:text-white">Scan Bill</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">Extract items automatically with AI</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-3"
            onPress={() => { setShowAddMenu(false); router.push('/shopping/voice-bill' as any); }}
          >
            <View className="w-10 h-10 bg-primary-600 rounded-full items-center justify-center mr-4">
              <Icon name="mic" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 dark:text-white">Speech to Text</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">Dictate your items and let AI structure them</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
            onPress={() => { setShowAddMenu(false); router.push('/shopping/add-bill' as any); }}
          >
            <View className="w-10 h-10 bg-gray-600 rounded-full items-center justify-center mr-4">
              <Icon name="create-outline" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900 dark:text-white">Enter Manually</Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">Type in shop and item details</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
