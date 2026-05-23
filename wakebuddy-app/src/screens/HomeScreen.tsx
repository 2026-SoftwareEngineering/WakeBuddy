import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  goLogin: () => void;
  goSignUp: () => void;
  goMyAlarms: () => void;
  goFriends: () => void;
};

export default function HomeScreen({
  goLogin,
  goSignUp,
  goMyAlarms,
  goFriends,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>WakeBuddy</Text>
      <Text style={styles.subtitle}>친구와 함께 관리하는 공유 알람 앱</Text>

      <TouchableOpacity style={styles.button} onPress={goMyAlarms}>
        <Text style={styles.buttonText}>내 알람 관리</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={goFriends}>
        <Text style={styles.buttonText}>친구 관리</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={goLogin}>
        <Text style={styles.buttonText}>로그인</Text>
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
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#222",
    padding: 15,
    borderRadius: 10,
  },
  outlineButtonText: {
    color: "#222",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
});