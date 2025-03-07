import { Button } from 'components/Button/Button';
import { RadioButton } from 'components/RadioButton/RadioButton';
import { View, Text, StyleSheet, Image } from 'react-native';
interface CardProps {
    data: any,
    isSelected?: boolean,
    isAssigned?: boolean,
    fromMenu?: boolean,
    onSendCard?: () => void,
    setIsSelected?: (value: any) => void,
}

/**
 * @description A component that can be used as agent card in the modal
 */

export function AgentCard({
    data,
    isSelected = false,
    setIsSelected,
    isAssigned = false,
    fromMenu = false,
    onSendCard,
}: CardProps) {
    return (
        <View key={data?.id} style={styles.container}>
            <View style={styles.personDetails}>
                <View >
                    <Image
                        source={{ uri: 'https://media.istockphoto.com/id/1388648617/photo/confident-caucasian-young-man-in-casual-denim-clothes-with-arms-crossed-looking-at-camera.jpg?s=612x612&w=0&k=20&c=YxctPklAOJMmy6Tolyvn45rJL3puk5RlKt39FO46ZeA=' }}
                        style={[styles.image, { borderColor: data?.color }]}
                    />
                </View>
                <View>
                    <Text style={styles.name}>
                        {data?.name} {data?.lastname}
                    </Text>
                    <Text style={styles.description}>
                        {data?.description}
                    </Text>
                </View>
            </View>
            <View >
                {
                    fromMenu && onSendCard ?
                        <Button
                            text='Send Card'
                            buttonStyle={{ backgroundColor: 'black' }}
                            textStyle={{ color: 'white' }}
                            onPress={onSendCard}
                        />
                        :
                        isAssigned ?
                            <Text style={styles.assignedText}>Assigned</Text>
                            : <RadioButton
                                checked={isSelected}
                                value={data?.id}
                                onChange={() => setIsSelected && setIsSelected(data)}
                            />}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
        height: 48,
        paddingRight: 16
    },
    name: {
        color: 'black',
        fontSize: 12,
        marginBottom: 4,
        fontWeight: 600
    },
    description: {
        color: 'black',
        fontSize: 8,
        fontWeight: 400
    },
    personDetails: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    image: {
        height: 32,
        width: 32,
        borderRadius: 16,
        marginRight: 6,
        borderWidth: 2
    }
    ,
    radioButtonContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    assignedText: {
        fontWeight: 700,
        fontSize: 16
    }

});
