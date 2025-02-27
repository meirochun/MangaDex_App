import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Image, TextInput, Dimensions } from "react-native";
import { Dialog, Portal, PaperProvider, TouchableOpacity } from "react-native-paper";
import axios from "axios";
import { styles } from "../utils/styles";
import { useWindowDimensions } from "react-native";

export default function SearchManga() {
  const [title, setTitle] = useState('');
  const baseURL = 'https://api.mangadex.org';
  const [manga, setManga] = useState([]);
  const [mangaImgs, setMangaImgs] = useState([]);
  const { width, height } = useWindowDimensions();
  const defaultCharacter = 'A';
  const [visible, setVisible] = useState(false);
  const [dialogError, setDialogError] = useState('An unknown error occurred.');

  useEffect(() => {

    const getManga = async () => {
      try {
        if (title.length < 1) {
          
          const resposta = await axios.get(`${baseURL}/manga?title=${defaultCharacter}&contentRating[]=suggestive&contentRating[]=safe`);
          setManga(resposta.data.data);

          const coverIds = resposta.data.data.map((manga) =>
            manga.relationships.find((rel) => rel.type === 'cover_art')?.id
          );

          const imgResponses = await Promise.all(
            coverIds.map(async (coverId) => {
              let attempts = 0;
              while (attempts < 10) {
                try {
                  if (coverId) {
                    const coverRes = await axios.get(`${baseURL}/cover/${coverId}`);
                    console.log("DEBUG: ", coverRes.data.data)
                    return coverRes.data.data.attributes.fileName;
                  }
                } catch (error) {
                  console.error("Error fetching data:", error);
                  attempts++;
                }
              }
              setDialogError('An error occurred while fetching some cover images. Retype the title to try again.');
              setVisible(true);
              return null;
            })
          );
          setMangaImgs(imgResponses);
          console.log(imgResponses);
        } else {
          const resposta = await axios.get(`${baseURL}/manga?title=${title}`);
          setManga(resposta.data.data);

          const coverIds = resposta.data.data.map((manga) =>
            manga.relationships.find((rel) => rel.type === 'cover_art')?.id
          );

          const imgResponses = await Promise.all(
            coverIds.map(async (coverId) => {
              if (coverId) {
                const coverRes = await axios.get(`${baseURL}/cover/${coverId}`);
                return coverRes.data.data.attributes.fileName;
              }
            })
          );
          setMangaImgs(imgResponses);
          console.log(imgResponses);
        }
      } catch (error) {
        console.error("Error retrieving data from Mangadex:", error);
        setDialogError('An error occurred while fetching data from Mangadex. Retype the title to try again.');
        setVisible(true);
      }
    };
    getManga();
  }, [title]);

  return (
    <PaperProvider>
      <View style={styles.fullBody}>
        <Text style={styles.textBigBold}>Search:</Text>
        <TextInput
          placeholder="Type the title here."
          value={title}
          style={styles.textInput}
          onChangeText={(text) => setTitle(text)}
        />
        <Portal>
          <Dialog visible={visible} onDismiss={() => setVisible(false)}>
            <Dialog.Title>Error</Dialog.Title>
            <Dialog.Content>
              <Text>{dialogError}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <TouchableOpacity onPress={() => setVisible(false)}><Text>teste</Text></TouchableOpacity>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        <FlatList
          style={{ ...styles.flatlistM, flex: 1, minWidth: width }}
          data={manga}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.container}>
              <View style={styles.containerManga}>
                {item.attributes.title.en ? (
                  <Text style={styles.textSmallBold}>{item.attributes.title.en}</Text>
                ) : (
                  <Text style={styles.textSmallBold}>{item.attributes.title.ja}</Text>
                )}
                <Text style={styles.textSmall}>Status: {item.attributes.status}</Text>
                {mangaImgs[index] && (
                  <View style={styles.mangaView}>
                    <Image
                      style={styles.mangaImgs}
                      source={{ uri: `https://uploads.mangadex.org/covers/${item.id}/${mangaImgs[index]}` }}
                    />
                  </View>
                )}
              </View>
            </View>
          )}
          numColumns={1}
          key={width >= 600 ? 2 : 1}
        />
      </View>
    </PaperProvider>
  );
}