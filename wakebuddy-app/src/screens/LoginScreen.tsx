import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthService } from "../services/AuthService";

type Props = {
  goHome: () => void;
  goSignUp: () => void;
};

export default function LoginScreen({ goHome, goSignUp }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("입력 오류", "이메일과 비밀번호를 입력해주세요.");
        return;
      }

      await AuthService.login(email, password);
      Alert.alert("로그인 성공", "로그인되었습니다.");
      goHome();
    } catch (error) {
      Alert.alert(
        "로그인 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    Alert.alert("로그아웃", "로그아웃되었습니다.");
    goHome();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goSignUp}>
        <Text style={styles.outlineButtonText}>회원가입으로 이동</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
        <Text style={styles.dangerButtonText}>로그아웃</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goHome}>
        <Text style={styles.backText}>홈으로 돌아가기</Text>
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
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#222",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#222",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  outlineButtonText: {
    color: "#222",
    textAlign: "center",
    fontWeight: "700",
  },
  dangerButton: {
    backgroundColor: "#ffdddd",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
  },
  dangerButtonText: {
    color: "#c00",
    textAlign: "center",
    fontWeight: "700",
  },
  backText: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
  },
});