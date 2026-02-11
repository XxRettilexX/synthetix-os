import React, { useEffect, useState } from 'react';
import { View, Text, Switch, FlatList, StyleSheet, TouchableOpacity, RefreshControl, SafeAreaView } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useDeviceStore } from '../store/deviceStore';
import { theme } from '../theme';

export default function HomeScreen() {
    const { user, signOut } = useAuthStore();
    const { devices, fetchDevices, toggleDevice } = useDeviceStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchDevices();
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
                            item.state.temperature
                                ? `${item.state.temperature}°C`
                                : item.state.on ? 'ON' : 'OFF'
                        ) : 'Unknown'}
                    </Text>
                </View>
                {/* Mostra switch solo se c'è uno stato 'on' */}
                {item.state && 'on' in item.state && (
                    <Switch
                        value={item.state.on}
                        onValueChange={() => handleToggle(item.id, item.state.on)}
                        trackColor={{ false: '#e1e4e8', true: theme.colors.primary }}
                        thumbColor={'#fff'}
                    />
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Ciao,</Text>
                    <Text style={styles.username}>{user?.email?.split('@')[0] || 'Utente'}</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Esci</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>I tuoi dispositivi</Text>

            <FlatList
                data={devices}
                renderItem={renderDevice}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nessun dispositivo trovato.</Text>
                        <Text style={styles.emptySubText}>Tira verso il basso per aggiornare.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    greeting: {
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    logoutButton: {
        padding: 8,
    },
    logoutText: {
        color: theme.colors.error,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginLeft: 20,
        marginBottom: 15,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexGrow: 1,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f0f7ff',
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
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 4,
    },
    deviceStatus: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    }
});
