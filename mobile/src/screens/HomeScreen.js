import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Switch,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView,
    ActivityIndicator
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';
import { theme } from '../theme';

export default function HomeScreen() {
    const { user, signOut } = useAuthStore();
    const { devices, fetchDevices, toggleDevice } = useDeviceStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchDevices().finally(() => setLoading(false));
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchDevices();
        } finally {
            setRefreshing(false);
        }
    };

    const handleToggle = (id, currentState) => {
        toggleDevice(id, currentState);
    };

    const renderDevice = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>
                        {item.device_type === 'virtual_light' ? '💡' : item.device_type === 'socket' ? '🔌' : '📱'}
                    </Text>
                </View>
                <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.name}</Text>
                    <Text style={styles.deviceStatus}>
                        {item.state ? (
                            'on' in item.state ? (item.state.on ? 'Attivo' : 'Spento') : 'Connesso'
                        ) : 'Offline'}
                    </Text>
                </View>
                {item.state && 'on' in item.state && (
                    <Switch
                        value={item.state.on}
                        onValueChange={() => handleToggle(item.id, item.state.on)}
                        trackColor={{ false: '#e1e4e8', true: theme.colors.primary }}
                        thumbColor={'#fff'}
                    />
                )}
            </View>

            {item.state && item.state.brightness !== undefined && item.state.on && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${item.state.brightness}%` }]} />
                    </View>
                    <Text style={styles.progressText}>Luminosità: {item.state.brightness}%</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Bentornato,</Text>
                    <Text style={styles.username}>{user?.email?.split('@')[0] || 'Utente'}</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={styles.profileBadge}>
                    <Text style={styles.profileInitial}>
                        {user?.email?.[0].toUpperCase()}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{devices.length}</Text>
                    <Text style={styles.statLabel}>Dispositivi</Text>
                </View>
                <View style={[styles.statBox, styles.statBoxBorder]}>
                    <Text style={styles.statValue}>
                        {devices.filter(d => d.state?.on).length}
                    </Text>
                    <Text style={styles.statLabel}>Accesi</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>100%</Text>
                    <Text style={styles.statLabel}>Connessi</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Dashboard Casa</Text>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={devices}
                    renderItem={renderDevice}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Nessun dispositivo.</Text>
                            <TouchableOpacity onPress={onRefresh} style={{ marginTop: 10 }}>
                                <Text style={{ color: theme.colors.primary }}>Tocca per aggiornare</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
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
        paddingBottom: 24,
    },
    greeting: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    profileBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    profileInitial: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 24,
        borderRadius: 20,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statBoxBorder: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#f1f5f9',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 24,
        marginBottom: 16,
    },
    list: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    icon: {
        fontSize: 24,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    deviceStatus: {
        fontSize: 13,
        color: '#64748b',
    },
    progressContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#fbbf24',
    },
    progressText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
    }
});
