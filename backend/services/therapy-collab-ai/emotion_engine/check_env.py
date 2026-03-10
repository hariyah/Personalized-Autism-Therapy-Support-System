import sys
out = []
out.append("python:" + sys.version.replace("\n"," "))
try:
    import tensorflow as tf
    out.append("tensorflow:" + getattr(tf, "__version__", "unknown"))
except Exception as e:
    out.append("tensorflow_error:" + repr(e))
try:
    import sklearn
    out.append("scikit_learn:" + getattr(sklearn, "__version__", "unknown"))
except Exception as e:
    out.append("scikit_learn_error:" + repr(e))
try:
    import numpy as np
    out.append("numpy:" + getattr(np, "__version__", "unknown"))
except Exception as e:
    out.append("numpy_error:" + repr(e))

with open("env_check_output.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(out))
print("\n".join(out))
