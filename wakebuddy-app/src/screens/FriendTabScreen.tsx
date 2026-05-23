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
import { FriendRequest } from "../models/FriendRequest";
import { FriendService } from "../services/FriendService";
import { FriendRequestService } from "../services/FriendRequestService";

type FriendTabMode = "list" | "add" | "sent" | "received";

type Props = {
  currentUser: User;
};

/**
 * 친구 탭 화면
 *
 * 친구 목록, 친구 추가, 보낸 요청 현황, 받은 요청함을 관리한다.
 */
export default function FriendTabScreen({ currentUser }: Props) {
  const [mode, setMode] = useState<FriendTabMode>("list");
  const [friends, setFriends] = useState<User[]>([]);
  const [friendEmail, setFriendEmail] = useState("");
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);

  /**
   * 친구 목록 조회
   */
  const loadFriends = async () => {
    const data = await FriendService.getFriends(currentUser.uid);
    setFriends(data);
  };

  /**
   * 보낸 친구 요청 조회
   */
  const loadSentRequests = async () => {
    const data = await FriendRequestService.getSentRequests(currentUser.uid);
    setSentRequests(data);
  };

  /**
   * 받은 친구 요청 조회
   */
  const loadReceivedRequests = async () => {
    const data = await FriendRequestService.getReceivedRequests(currentUser.uid);
    setReceivedRequests(data);
  };

  /**
   * 현재 선택된 탭에 맞는 데이터를 조회한다.
   */
  const loadDataByMode = async () => {
    try {
      if (mode === "list") await loadFriends();
      if (mode === "sent") await loadSentRequests();
      if (mode === "received") await loadReceivedRequests();
    } catch (error) {
      Alert.alert(
        "조회 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  useEffect(() => {
    loadDataByMode();
  }, [mode]);

  /**
   * 친구 요청 보내기
   */
  const handleSendRequest = async () => {
    try {
      await FriendRequestService.sendFriendRequest(
        currentUser.uid,
        friendEmail,
      );

      setFriendEmail("");
      Alert.alert("요청 완료", "친구 요청을 보냈습니다.");
      setMode("sent");
    } catch (error) {
      Alert.alert(
        "요청 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  /**
   * 보낸 친구 요청 취소
   */
  const handleCancelRequest = async (requestId: string) => {
    try {
      await FriendRequestService.cancelFriendRequest(
        requestId,
        currentUser.uid,
      );

      await loadSentRequests();
    } catch (error) {
      Alert.alert(
        "취소 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  /**
   * 받은 친구 요청 수락
   */
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await FriendRequestService.acceptFriendRequest(
        requestId,
        currentUser.uid,
      );

      await loadReceivedRequests();
      Alert.alert("수락 완료", "친구 요청을 수락했습니다.");
    } catch (error) {
      Alert.alert(
        "수락 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  /**
   * 받은 친구 요청 거절
   */
  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendRequestService.rejectFriendRequest(
        requestId,
        currentUser.uid,
      );

      await loadReceivedRequests();
    } catch (error) {
      Alert.alert(
        "거절 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  /**
   * 친구 삭제
   */
  const handleRemoveFriend = async (friendId: string) => {
    try {
      await FriendService.removeFriend(currentUser.uid, friendId);
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
      <Text style={styles.title}>친구</Text>

      <View style={styles.menuRow}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMode("list")}>
          <Text style={styles.menuText}>친구 목록</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => setMode("add")}>
          <Text style={styles.menuText}>친구 추가</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => setMode("sent")}>
          <Text style={styles.menuText}>신청 현황</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMode("received")}
        >
          <Text style={styles.menuText}>수신함</Text>
        </TouchableOpacity>
      </View>

      {mode === "list" && (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={<Text style={styles.empty}>친구가 없습니다.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.cardTitle}>{item.displayName}</Text>
                <Text style={styles.cardSub}>{item.email}</Text>
              </View>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={() => handleRemoveFriend(item.uid)}
              >
                <Text style={styles.dangerText}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {mode === "add" && (
        <View>
          <Text style={styles.label}>친구 이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="친구 이메일 입력"
            value={friendEmail}
            onChangeText={setFriendEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSendRequest}>
            <Text style={styles.primaryButtonText}>친구 요청 보내기</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === "sent" && (
        <FlatList
          data={sentRequests}
          keyExtractor={(item) => item.requestId}
          ListEmptyComponent={
            <Text style={styles.empty}>보낸 친구 요청이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.cardTitle}>받는 사용자</Text>
                <Text style={styles.cardSub}>{item.receiverId}</Text>
                <Text style={styles.status}>상태: {item.status}</Text>
              </View>

              {item.status === "pending" && (
                <TouchableOpacity
                  style={styles.dangerButton}
                  onPress={() => handleCancelRequest(item.requestId)}
                >
                  <Text style={styles.dangerText}>취소</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      {mode === "received" && (
        <FlatList
          data={receivedRequests}
          keyExtractor={(item) => item.requestId}
          ListEmptyComponent={
            <Text style={styles.empty}>받은 친구 요청이 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.cardTitle}>보낸 사용자</Text>
                <Text style={styles.cardSub}>{item.senderId}</Text>
                <Text style={styles.status}>상태: {item.status}</Text>
              </View>

              {item.status === "pending" && (
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(item.requestId)}
                  >
                    <Text style={styles.acceptText}>수락</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={() => handleRejectRequest(item.requestId)}
                  >
                    <Text style={styles.dangerText}>거절</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
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
    marginBottom: 18,
  },
  menuRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  menuText: {
    fontWeight: "700",
  },
  label: {
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
  },
  empty: {
    textAlign: "center",
    color: "#777",
    marginTop: 40,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  cardSub: {
    color: "#666",
    marginTop: 4,
  },
  status: {
    color: "#777",
    marginTop: 6,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  acceptButton: {
    backgroundColor: "#ddffdd",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  acceptText: {
    color: "#087a08",
    fontWeight: "800",
  },
  dangerButton: {
    backgroundColor: "#ffdddd",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  dangerText: {
    color: "#c00",
    fontWeight: "800",
  },
});