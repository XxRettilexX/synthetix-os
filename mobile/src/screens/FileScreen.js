import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import apiClient from '../api/client';

export default function FileScreen() {
    const { session } = useAuthStore();
    const [files, setFiles] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const insets = useSafeAreaInsets();

    const fetchFiles = async () => {
        try {
            const { data } = await apiClient.get('/files/');
            setFiles(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            // Mock data if API fails
            if (!e.response) {
                setFiles([
                    { id: '1', name: 'Contratto_Affitto.pdf', size: 520000, created_at: new Date().toISOString() },
                    { id: '2', name: 'Foto_Mare.jpg', size: 3800000, created_at: new Date().toISOString() },
                    { id: '3', name: 'Note_Spesa.docx', size: 120000, created_at: new Date().toISOString() },
                    { id: '4', name: 'Logo_Synthetix.png', size: 850000, created_at: new Date().toISOString() },
                ]);
            }
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchFiles();
    }, []);

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const handleDelete = async (id) => {
        Alert.alert(
            "Elimina File",
            "Sei sicuro di voler eliminare questo file?",
            [
                { text: "Annulla", style: "cancel" },
                {
                    text: "Elimina",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/files/${id}`);
                            fetchFiles();
                        } catch (e) {
                            Alert.alert("Errore", "Impossibile eliminare il file");
                        }
                    }
                }
            ]
        );
    };

    const renderFile = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>📄</Text>
            </View>
            <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item?.name}</Text>
                <Text style={styles.fileMeta}>
                    {String(formatSize(item?.size || 0))} • {String(item?.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A')}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                <Text style={{ fontSize: 18, color: theme.colors.error }}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );

    const filteredFiles = files.filter(f => f?.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Cloud Explorer</Text>
                <TouchableOpacity style={styles.uploadButton}>
                    <Text style={styles.uploadText}>+ Carica</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Cerca file..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredFiles}
                    renderItem={renderFile}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={!!refreshing}
                            onRefresh={() => { setRefreshing(true); fetchFiles(); }}
                            colors={[theme.colors.primary]}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <Text style={{ fontSize: 40 }}>📂</Text>
                            </View>
                            <Text style={styles.emptyText}>Nessun file trovato.</Text>
                            <Text style={styles.emptySubText}>I tuoi file caricati appariranno qui.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    uploadButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    uploadText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        fontSize: 15,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    icon: {
        fontSize: 22,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    fileMeta: {
        fontSize: 12,
        color: '#94a3b8',
    },
    actionButton: {
        padding: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        paddingHorizontal: 40,
    }
});
