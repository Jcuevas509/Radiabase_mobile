import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { AgentCard } from 'components/Card/AgentCard';
import LogoImage from 'components/LogoImage/LogoImage';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from 'components/Button/Button';
import { useNavigation } from '@react-navigation/native';
import { dashboardData } from 'constants/dataExample';

interface CardProps {
    title: string;
    number: number;
}

const DashboardScreen = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState('Today');
    const [contactData, setContactData] = useState({
        leads: 0,
        customers: 0,
        recruits: 0
    });

    useEffect(() => {
        setContactData(dashboardData[activeTab as keyof typeof dashboardData]);
    }, [activeTab]);

    const Card: React.FC<CardProps> = ({ title, number }) => {
        return (
            <View style={styles.contactBox}>
                <Text style={styles.contactTitle}>{title}</Text>
                <Text style={styles.contactNumber}>{number}</Text>
            </View>
        );
    };

    const TabButton = ({ title }: { title: string }) => (
        <TouchableOpacity onPress={() => setActiveTab(title)}>
            <Text style={[styles.tabText, activeTab === title && styles.activeTab]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.agentContainer}>
                    <AgentCard
                        fromMenu={true}
                        data={{
                            id: 1,
                            name: "John",
                            lastname: "Doe",
                            description: "Sales Representative",
                            color: "#FF5733",
                        }}
                        onSendCard={() => console.log('send')}
                    />
                </View>
            </SafeAreaView>
            <ScrollView style={styles.content}>
                <View style={styles.assignedAreasContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionSubHeader}>
                            <Text style={styles.sectionTitle}>
                                Assigned Areas
                            </Text>
                            <TouchableOpacity style={styles.infoButton}>
                                <MaterialIcons name="info-outline" size={16} color="#D9D9D9" />
                            </TouchableOpacity>
                        </View>
                        <Button
                            text='View Map'
                            buttonStyle={{ backgroundColor: 'black' }}
                            textStyle={{ color: 'white' }}
                            onPress={() => navigation.navigate('index' as never)}
                        />

                    </View>
                    <View style={styles.areaImagesContainer}>
                        <View style={styles.areaImageWrapper}>
                            <MapView
                                style={styles.map}
                                mapType={'satellite'}
                                initialRegion={{
                                    latitude: 40.7128,
                                    longitude: -74.0060,
                                    latitudeDelta: 0.0922,
                                    longitudeDelta: 0.0421,
                                }}
                            />
                            <Text style={styles.areaText}>New York Region</Text>
                        </View>
                        <View style={styles.areaImageWrapper}>
                            <MapView
                                style={styles.map}
                                mapType={'satellite'}
                                initialRegion={{
                                    latitude: 34.0522,
                                    longitude: -118.2437,
                                    latitudeDelta: 0.0922,
                                    longitudeDelta: 0.0421,
                                }}
                            />
                            <Text style={styles.areaText}>Los Angeles Region</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.contactsContainer}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionSubHeader}>
                            <Text style={styles.sectionTitle}>
                                Contacts
                            </Text>
                            <TouchableOpacity style={styles.infoButton}>
                                <MaterialIcons name="info-outline" size={16} color="#D9D9D9" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.tabContainer}>
                            <TabButton title="Today" />
                            <TabButton title="This Week" />
                            <TabButton title="This Month" />
                        </View>
                    </View>
                    <View style={styles.contactsGrid}>
                        <Card title="Leads" number={contactData.leads} />
                        <Card title="Customers" number={contactData.customers} />
                        <Card title="Recruits" number={contactData.recruits} />
                    </View>
                </View>
            </ScrollView>
            <LogoImage type='large' />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    safeArea: {
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
    },
    agentContainer: {
        paddingLeft: 24,
        paddingRight: 10,
        borderBottomColor: '#D9D9D9',
        borderBottomWidth: 1,
        width: '100%',
    },
    assignedAreasContainer: {
        padding: 20,
    },
    contactsContainer: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 600,
    },
    tabContainer: {
        flexDirection: 'row',
    },
    tabText: {
        marginLeft: 10,
        fontSize: 8,
        fontWeight: 600,
        color: '#909090',
    },
    activeTab: {
        color: 'black',
    },
    contactsGrid: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    contactBox: {
        width: 110,
        height: 96,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 8,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 12,
        fontWeight: 300,
        marginBottom: 16,
    },
    contactNumber: {
        fontSize: 24,
        fontWeight: 600,
    },
    areaImagesContainer: {
        flexDirection: 'row',
        gap: 24,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    areaImageWrapper: {
        width: 96,
    },
    map: {
        width: 96,
        height: 96,
        borderRadius: 15,
    },
    areaText: {
        marginTop: 8,
        fontSize: 8,
        fontWeight: 300,
        textAlign: 'center',
    },
    infoButton: {
        marginLeft: 16,
    },
    sectionSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});

export default DashboardScreen;