import re

with open('src/pages/Register/RegisterPage.tsx', 'r') as f:
    content = f.read()

# Rename component
content = content.replace("export function LoginPage()", "export function RegisterPage()")

# Remove loginSchema
content = re.sub(r'const loginSchema = z\.object\(\{.*?\n\)\n\ntype LoginFormData = z\.infer<typeof loginSchema>\n', '', content, flags=re.DOTALL)

# Remove loginForm
content = re.sub(r'  const loginForm = useForm<LoginFormData>\(\{.*?\}\)\n', '', content, flags=re.DOTALL)

# Remove loginAccount mutation
content = re.sub(r'  const \{ mutate: loginAccount.*?\}\)\n', '', content, flags=re.DOTALL)

# Remove onLoginSubmit
content = re.sub(r'  const onLoginSubmit = \(data: LoginFormData\) => loginAccount\(data\)\n', '', content)

# Remove setAuth usage from imports and hook if it's not needed (Wait, Register doesn't use setAuth, but useAuthStore is used for redirect. We'll leave it).
# Remove tab state
content = re.sub(r"  const \[tab, setTab\] = useState<'login' \| 'register'>\('login'\)\n", '', content)

# Remove useEffect for tab
content = re.sub(r"  // Reset form states between tab switch\n  useEffect\(\(\) => \{\n    setShowPassword\(false\)\n    setShowConfirmPassword\(false\)\n  \}, \[tab\]\)\n", '', content)

# Remove the login motion.div block
content = re.sub(r"              \{tab === 'login' \? \(\n                <motion\.div\n                  key=\"login\".*?                </motion\.div>\n              \) : \(\n", '', content, flags=re.DOTALL)

# Change setTab('login') to navigate(ROUTES.LOGIN)
content = content.replace("onClick={() => setTab('login')}", "onClick={() => navigate(ROUTES.LOGIN)}")
# Also in the onSuccess of registerAccount:
content = content.replace("setTab('login')", "navigate(ROUTES.LOGIN)")

# Remove AnimatePresence closing and motion.div closing
content = re.sub(r"              \)\}\n            </AnimatePresence>", '', content, flags=re.DOTALL)
content = content.replace("<AnimatePresence mode=\"wait\" initial={false}>\n\n", "")

with open('src/pages/Register/RegisterPage.tsx', 'w') as f:
    f.write(content)

