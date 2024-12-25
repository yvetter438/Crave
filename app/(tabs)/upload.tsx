import { View, Text, Image, StyleSheet, TextInput, Pressable } from "react-native";
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function Upload() {
    const [caption, setCaption] = useState('');
    const [image, setImage] = useState<string | null>(null);

    useEffect(() => {
        if (!image) {
            pickImage();
        }
    }, [image])
    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
        });
    
        console.log(result);
    
        if (!result.canceled) {
          setImage(result.assets[0].uri);
        }
      };

    return (
        <View style={styles.container}>
            <View style={styles.topContent}>
                {image ? (<Image
                    style={styles.image}
                    source={{uri: image,}}
                /> 
                ) : (
                    <View style={styles.image}></View>
                )}
                <Text 
                    onPress={pickImage}
                    style={styles.text}>Upload Video</Text>

                <TextInput 
                    value={caption}
                    onChangeText={(newValue) => setCaption(newValue)}
                    style={styles.caption}
                    placeholder="Caption" 
                    placeholderTextColor={'#000'}
                />
            </View>

            <Pressable style={styles.button}>
                <Text style={styles.buttonText}>Share</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between', // Space between top content and bottom button
        padding: 16,
    },
    topContent: {
        alignItems: 'center', // Center the image, text, and description horizontally
    },
    image: {
        width: 208,             
        aspectRatio: 3 / 4,     
        borderRadius: 16,       
        backgroundColor: '#cbd5e1',
        marginBottom: 16, // Space between image and "Change" text
    },
    text: {
        fontSize: 18,
        marginBottom: 8, // Space between text and TextInput
    },
    caption: {
        width: '100%',
        padding: 8,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 8,
        alignSelf: 'center', // Center the button horizontally
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});
