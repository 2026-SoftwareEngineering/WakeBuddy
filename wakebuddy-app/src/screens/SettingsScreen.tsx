import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { User } from "../models/User";
import { AuthService } from "../services/AuthService";

type Props = {
  currentUser: User;
};

/**
 * 설정 화면
 *
 * 로그인한 사용자의 계정 정보를 보여주고,
 * 로그아웃 기능을 제공한다.
 */
export default function SettingsScreen({ currentUser }: Props) {
  /**
   * 로그아웃 처리
   *
   * 로그아웃이 성공하면 App.tsx의 watchAuthState가 감지하여
   * 자동으로 Main 화면으로 이동한다.
   */
  const handleLogout = async () => {
    try {
      await AuthService.logout();
      Alert.alert("로그아웃", "로그아웃되었습니다.");
    } catch (error) {
      Alert.alert(
        "로그아웃 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>이름</Text>
        <Text style={styles.cardValue}>{currentUser.displayName}</Text>

        <Text style={styles.cardLabel}>이메일</Text>
        <Text style={styles.cardValue}>{currentUser.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>로그아웃</Text>
      </TouchableOpacity>
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
    marginBottom: 22,
  },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
  },
  cardLabel: {
    color: "#777",
    marginTop: 10,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: "#ffdddd",
    padding: 15,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: "#c00",
    textAlign: "center",
    fontWeight: "800",
  },
});