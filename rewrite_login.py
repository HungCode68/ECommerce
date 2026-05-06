import re

with open('src/pages/Login/LoginPage.tsx', 'r') as f:
    content = f.read()

# Remove registerSchema
content = re.sub(r'const registerSchema = z\.object\(\{.*?\n\)\n\ntype RegisterFormData = z\.infer<typeof registerSchema>\n', '', content, flags=re.DOTALL)

# Remove registerForm
content = re.sub(r'  const registerForm = useForm<RegisterFormData>\(\{.*?\}\)\n', '', content, flags=re.DOTALL)

# Remove registerAccount mutation
content = re.sub(r'  const { mutate: registerAccount.*?\}\)\n', '', content, flags=re.DOTALL)

# Remove onRegisterSubmit
content = re.sub(r'  const onRegisterSubmit = \(data: RegisterFormData\) => registerAccount\(data\)\n', '', content)

# Remove tab state
content = re.sub(r"  const \[tab, setTab\] = useState<'login' \| 'register'>\('login'\)\n", '', content)

# Remove useEffect for tab
content = re.sub(r"  // Reset form states between tab switch\n  useEffect\(\(\) => \{\n    setShowPassword\(false\)\n    setShowConfirmPassword\(false\)\n  \}, \[tab\]\)\n", '', content)

# Change setTab('register') to navigate(ROUTES.REGISTER)
content = content.replace("onClick={() => setTab('register')}", "onClick={() => navigate(ROUTES.REGISTER)}")

# Remove the register motion.div block
content = re.sub(r"              \) : \(\n                <motion\.div\n                  key=\"register\".*?                </motion\.div>\n              \)", '', content, flags=re.DOTALL)

# Remove AnimatePresence and tab === 'login' ? (
content = content.replace("<AnimatePresence mode=\"wait\" initial={false}>\n\n              {tab === 'login' ? (\n", "")
content = content.replace("              {tab === 'login' ? (\n", "")
content = content.replace("</AnimatePresence>", "")

with open('src/pages/Login/LoginPage.tsx', 'w') as f:
    f.write(content)

