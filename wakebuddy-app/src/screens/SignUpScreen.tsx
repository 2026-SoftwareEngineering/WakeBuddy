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
  goLogin: () => void;
};

export default function SignUpScreen({ goHome, goLogin }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    try {
      if (!displayName || !email || !password) {
        Alert.alert("입력 오류", "이름, 이메일, 비밀번호를 모두 입력해주세요.");
        return;
      }

      await AuthService.signUp(email, password, displayName);
      Alert.alert("회원가입 성공", "계정이 생성되었습니다.");
      goHome();
    } catch (error) {
      Alert.alert(
        "회원가입 실패",
        error instanceof Error ? error.message : "오류가 발생했습니다.",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput
        style={styles.input}
        placeholder="이름"
        value={displayName}
        onChangeText={setDisplayName}
      />

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

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineButton} onPress={goLogin}>
        <Text style={styles.outlineButtonText}>로그인으로 이동</Text>
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
  backText: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
  },
});