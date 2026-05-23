import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { User } from "../models/User";
import { AuthService } from "../services/AuthService";
import { FriendService } from "../services/FriendService";

const DEMO_USER_ID = "demo-user";

type Props = {
  goHome: () => void;
};

export default function FriendListScreen({ goHome }: Props) {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendEmail, setFriendEmail] = useState("");

  const getUserId = () => AuthService.getCurrentUser()?.uid ?? DEMO_USER_ID;

  const loadFriends = async () => {
    const data = await FriendService.getFriends(getUserId());
    setFriends(data);
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleAddFriend = async () => {
    try {
      if (!friendEmail) {
        Alert.alert("입력 오류", "친구 이메일을 입력해주세요.");
        return;
      }

      await FriendService.addFriend(getUserId(), friendEmail);
      setFriendEmail("");
      await loadFriends();
    } catch (error) {
      Alert.alert(
        "친구 추가 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await FriendService.removeFriend(getUserId(), friendId);
      await loadFriends();
    } catch (error) {
      Alert.alert(
        "친구 삭제 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>친구 관리</Text>

      <TextInput
        style={styles.input}
        placeholder="친구 이메일"
        value={friendEmail}
        onChangeText={setFriendEmail}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleAddFriend}>
        <Text style={styles.buttonText}>친구 추가</Text>
      </TouchableOpacity>

      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        ListEmptyComponent={
          <Text style={styles.empty}>등록된 친구가 없습니다.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.friendName}>{item.displayName}</Text>
              <Text style={styles.friendEmail}>{item.email}</Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveFriend(item.uid)}
            >
              <Text style={styles.deleteButtonText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity onPress={goHome}>
        <Text style={styles.backText}>홈으로 돌아가기</Text>
      </TouchableOpacity>

      <Text style={styles.help}>
        친구 추가 테스트용 이메일은 FriendService의 임시 사용자 목록에 있어야 합니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 30,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  friendName: {
    fontSize: 17,
    fontWeight: "700",
  },
  friendEmail: {
    color: "#666",
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: "#ffdddd",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: "#c00",
    fontWeight: "700",
  },
  backText: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
  },
  help: {
    marginTop: 14,
    color: "#777",
    lineHeight: 20,
  },
});