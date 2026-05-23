import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  goLogin: () => void;
  goSignUp: () => void;
};

/**
 * 비로그인 상태의 메인 화면
 *
 * 요구사항에 따라 Main 화면에는 로그인과 회원가입 버튼만 표시한다.
 */
export default function MainScreen({ goLogin, goSignUp }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WakeBuddy</Text>
      <Text style={styles.subtitle}>친구와 함께 관리하는 공유 알람 앱</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={goLogin}>
        <Text style={styles.primaryButtonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goSignUp}>
        <Text style={styles.outlineButtonText}>회원가입</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 44,
  },
  primaryButton: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#222",
    padding: 15,
    borderRadius: 12,
  },
  outlineButtonText: {
    color: "#222",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
});